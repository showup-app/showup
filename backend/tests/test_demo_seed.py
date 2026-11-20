"""The demo cast must keep showing every screen state. These tests read it back through the API,
the same way the app does, so a change that empties a section or breaks a number fails in CI."""

import re
from datetime import UTC, datetime, timedelta

from fastapi.testclient import TestClient
from sqlalchemy import func, select
from sqlalchemy.orm import Session

from app.demo_seed import DEMO_DOMAIN, GAMES, MAIN, SECOND, USERS, VANCOUVER, seed_demo
from app.models import Attendance, Game, Signup, User
from app.reputation import MARK_WINDOW_DAYS
from app.security import create_access_token, hash_password
from app.seed import SEED_DOMAIN, seed

REPUTATIONS = {
    "Taylor": 89,
    "Priya": 100,
    "Marcus": 57,
    "Elena": 88,
    "Diego": 90,
    "Leo": 83,
    "Zoe": 100,
    "Omar": 100,
    "Hana": 100,
    "Noah": 100,
}


def _headers(db: Session, name: str) -> dict[str, str]:
    user = db.scalar(select(User).where(User.email == f"{name.lower()}@{DEMO_DOMAIN}"))
    assert user is not None, f"no demo user {name}"
    return {"Authorization": f"Bearer {create_access_token(user.id)}"}


def _game_id(db: Session, key: str) -> int:
    venue = next(g.venue for g in GAMES if g.key == key)
    sport = next(g.sport for g in GAMES if g.key == key)
    return db.scalars(select(Game.id).where(Game.venue == venue, Game.sport == sport)).one()


def _counts(db: Session) -> list[int | None]:
    """Rows in users, games, signups, attendance."""
    return [
        db.scalar(select(func.count()).select_from(model))
        for model in (User, Game, Signup, Attendance)
    ]


def _started(game: dict) -> bool:
    return datetime.fromisoformat(game["starts_at"]) <= datetime.now(UTC)


def test_running_it_again_recreates_the_same_rows(db: Session) -> None:
    first = seed_demo(db)
    after_first = _counts(db)
    second = seed_demo(db)

    assert first == second
    assert _counts(db) == after_first
    assert first["users"] == len(USERS) == 10
    assert first["games"] == len(GAMES)


def test_it_leaves_real_users_and_the_test_seed_alone(db: Session) -> None:
    seed(db)
    db.add(User(email="someone@example.com", password_hash=hash_password("x" * 12), name="Real"))
    db.commit()
    before = _counts(db)

    seed_demo(db)
    seed_demo(db)

    others = db.scalars(select(User.email).where(User.email.not_like(f"%@{DEMO_DOMAIN}"))).all()
    assert "someone@example.com" in others
    assert sum(e.endswith(f"@{SEED_DOMAIN}") for e in others) == 5
    sam = db.scalar(select(User).where(User.email == f"sam@{SEED_DOMAIN}"))
    assert sam is not None and sam.reputation == 75
    assert _counts(db)[0] == (before[0] or 0) + len(USERS)


def test_every_reputation_is_the_one_the_walkthrough_promises(db: Session) -> None:
    seed_demo(db)

    stored = {u.name: u.reputation for u in db.scalars(select(User))}
    assert stored == REPUTATIONS


def test_main_account_profile(client: TestClient, db: Session) -> None:
    seed_demo(db)

    me = client.get("/auth/me", headers=_headers(db, MAIN)).json()

    assert me["email"] == f"taylor@{DEMO_DOMAIN}"
    assert (me["reputation"], me["games_played"], me["games_hosted"]) == (89, 5, 1)
    assert me["is_new"] is False


def test_home_has_every_section_filled(client: TestClient, db: Session) -> None:
    seed_demo(db)

    body = client.get("/me/games?include_past=true", headers=_headers(db, MAIN)).json()
    hosting, joined = body["hosting"], body["joined"]

    window = datetime.now(UTC) - timedelta(days=MARK_WINDOW_DAYS)
    needs = [
        g
        for g in hosting
        if _started(g)
        and g["status"] in ("open", "full")
        and datetime.fromisoformat(g["starts_at"]) > window
    ]
    assert [g["venue"] for g in needs] == ["BCIT Gym"]

    upcoming_hosting = [g for g in hosting if not _started(g)]
    assert sorted(g["status"] for g in upcoming_hosting) == ["cancelled", "open", "open"]
    assert [g["spots_left"] for g in upcoming_hosting if g["min_reputation"] == 80] == [2]

    upcoming_joined = [g for g in joined if not _started(g)]
    assert sorted(g["status"] for g in upcoming_joined) == ["cancelled", "full", "open", "open"]
    assert {g["cost"] > 0 for g in upcoming_joined} == {True, False}


def test_profile_history_shows_every_outcome(client: TestClient, db: Session) -> None:
    """Joined: two "no change", a no-show that costs 17, three recoveries, and one game the host
    never marked. Hosted: one played game where 3 of 4 showed up."""
    seed_demo(db)

    body = client.get("/me/games?include_past=true", headers=_headers(db, MAIN)).json()
    past = sorted((g for g in body["joined"] if _started(g)), key=lambda g: g["starts_at"])

    marked = [g for g in past if g["my_showed_up"] is not None]
    assert [g["my_reputation_change"] for g in marked] == [0, 0, -17, 3, 2, 1]
    assert [g["my_showed_up"] for g in marked] == [True, True, False, True, True, True]
    unmarked = [g for g in past if g["my_showed_up"] is None]
    assert [(g["venue"], g["my_reputation_change"]) for g in unmarked] == [
        ("Stanley Park Tennis Courts", None)
    ]

    played = [g for g in body["hosting"] if g["status"] == "played"]
    assert [(g["showed_up_count"], g["marked_count"]) for g in played] == [(3, 4)]


def test_explore_has_variety_and_nothing_the_main_account_cannot_join(
    client: TestClient, db: Session
) -> None:
    seed_demo(db)
    headers = _headers(db, MAIN)
    me = client.get("/auth/me", headers=headers).json()

    games = client.get("/games", headers=headers).json()

    assert all(g["status"] != "cancelled" and not _started(g) for g in games)
    assert {g["sport"] for g in games} == {
        "basketball",
        "soccer",
        "volleyball",
        "badminton",
        "tennis",
        "pickleball",
        "ultimate",
        "hockey",
    }
    others = [g for g in games if g["host_id"] != me["id"] and not g["joined"]]
    assert len(others) == 7
    assert sum(g["spots_left"] == 0 for g in others) == 1
    assert sum(1 <= g["spots_left"] <= 3 for g in others) == 1
    assert {g["cost"] > 0 for g in others} == {True, False}
    assert {g["min_reputation"] for g in others} == {0, 70, 80}
    assert all(g["effective_min_reputation"] <= me["reputation"] for g in games)
    assert len([g for g in games if "burnaby" in g["address"].lower()]) >= 3


def test_every_value_is_one_the_app_displays_cleanly(client: TestClient, db: Session) -> None:
    seed_demo(db)

    games = client.get("/games?include_past=true", headers=_headers(db, MAIN)).json()
    mine = client.get("/me/games?include_past=true", headers=_headers(db, MAIN)).json()
    games += [g for g in mine["hosting"] + mine["joined"] if g["status"] == "cancelled"]

    assert len(games) == len(GAMES)
    for g in games:
        assert re.fullmatch(r"[^,]+, (Burnaby|Vancouver|Richmond)", g["address"]), g["address"]
        assert g["duration_minutes"] in (60, 90, 120)
        assert g["min_reputation"] in (0, 70, 80)
        assert g["cost"] <= 12 and g["cost"] == int(g["cost"])
        local = datetime.fromisoformat(g["starts_at"]).astimezone(VANCOUVER)
        assert 9 <= local.hour <= 21 and local.minute in (0, 30)
        if g["status"] in ("open", "full"):
            assert (g["status"] == "full") == (g["spots_left"] == 0)


def test_attendance_roster_mixes_new_and_rated_players(client: TestClient, db: Session) -> None:
    seed_demo(db)
    game_id = _game_id(db, "t_needs")

    detail = client.get(f"/games/{game_id}", headers=_headers(db, MAIN)).json()

    players = {p["name"]: p for p in detail["players"]}
    assert set(players) == {"Priya", "Leo", "Hana", "Noah"}
    assert {name for name, p in players.items() if p["is_new"]} == {"Hana", "Noah"}
    assert (players["Priya"]["reputation"], players["Leo"]["reputation"]) == (100, 83)
    assert all(p["showed_up"] is None for p in players.values())


def test_the_live_demo_moves_work(client: TestClient, db: Session) -> None:
    """The three things the presenter does on stage: mark attendance on the ended game, join a
    game from Explore, and see the second account's score move after a no-show."""
    seed_demo(db)
    main = _headers(db, MAIN)
    needs = _game_id(db, "t_needs")
    roster = client.get(f"/games/{needs}", headers=main).json()["players"]

    marks = [{"user_id": p["id"], "showed_up": p["name"] != SECOND} for p in roster]
    marked = client.post(f"/games/{needs}/attendance", json={"marks": marks}, headers=main)
    assert marked.status_code == 200
    assert marked.json()["status"] == "played"
    second = client.get("/auth/me", headers=_headers(db, SECOND)).json()
    assert second["reputation"] == 88

    joined = client.post(f"/games/{_game_id(db, 'e_soccer')}/join", headers=main)
    assert joined.status_code == 201
    assert "Taylor" in [p["name"] for p in joined.json()["players"]]
