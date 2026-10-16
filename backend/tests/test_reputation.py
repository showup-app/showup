from collections.abc import Callable
from datetime import UTC, datetime, timedelta

from fastapi.testclient import TestClient
from sqlalchemy import select
from sqlalchemy.orm import Session

from app.models import Attendance, Game, User
from app.reputation import (
    CUSHION,
    MAX_MIN_REPUTATION,
    NEW_PLAYER_GAMES,
    compute,
    effective_min_reputation,
    player_stats,
    recompute,
)
from app.seed import GAMES, seed

Headers = Callable[[str], dict[str, str]]


def _game_id(db: Session, index: int) -> int:
    return db.scalar(select(Game.id).where(Game.venue == GAMES[index][2]))


def _user(db: Session, name: str) -> User:
    return db.scalar(select(User).where(User.name == name))


# ---------- the formula ----------


def test_formula_matches_the_decision_doc() -> None:
    assert compute(0, 0) == 100  # brand new
    assert compute(1, 1) == 100  # first game, showed up
    assert compute(0, 1) == 75  # first game, no-show
    assert compute(2, 3) == 83  # no-show then two shows
    assert compute(20, 21) == 96  # twenty shows, one slip
    assert compute(0, 3) == 50  # three no-shows, nothing else
    assert compute(0, 100) < compute(0, 3)  # keeps falling but never below 0
    assert compute(0, 10_000) >= 0


def test_new_users_start_at_100(db: Session) -> None:
    db.add(User(email="fresh@test.local", password_hash="x", name="Fresh"))
    db.commit()

    assert _user(db, "Fresh").reputation == 100


def test_seed_reputations_follow_the_marks(db: Session) -> None:
    seed(db)

    assert _user(db, "Jordan").reputation == 100  # showed up once
    assert _user(db, "Sam").reputation == compute(0, 1) == 75  # one no-show
    assert _user(db, "Maya").reputation == 100  # never marked


def test_recompute_heals_after_good_games(db: Session) -> None:
    seed(db)
    sam = _user(db, "Sam")
    alex = _user(db, "Alex")
    played = _game_id(db, 6)
    # Pretend Sam attended CUSHION more marked games; reuse the played game's host as marker.
    for i in range(CUSHION):
        g = Game(
            host_id=alex.id,
            sport="soccer",
            venue=f"Healing {i}",
            address="x",
            starts_at=datetime.now(UTC) - timedelta(days=i + 3),
            spots=10,
            status="played",
        )
        db.add(g)
        db.flush()
        db.add(Attendance(game_id=g.id, user_id=sam.id, showed_up=True, marked_by=alex.id))
    db.flush()

    assert recompute(db, sam) == compute(CUSHION, CUSHION + 1) == 86
    assert played is not None


# ---------- "New" and the games count ----------


def test_player_stats_mark_newcomers(db: Session) -> None:
    seed(db)
    jordan, maya = _user(db, "Jordan"), _user(db, "Maya")

    stats = player_stats(db, [jordan.id, maya.id])

    assert stats[jordan.id]["games_played"] == 1
    assert stats[jordan.id]["is_new"] is True  # 1 marked + 0 hosted-and-played < 3
    assert stats[maya.id] == {"games_played": 0, "games_hosted": 0, "is_new": True}


def test_hosting_played_games_clears_new(db: Session) -> None:
    seed(db)
    alex = _user(db, "Alex")  # hosted the one played game
    for i in range(NEW_PLAYER_GAMES - 1):
        db.add(
            Game(
                host_id=alex.id,
                sport="soccer",
                venue=f"Hosted {i}",
                address="x",
                starts_at=datetime.now(UTC) - timedelta(days=i + 1),
                spots=10,
                status="played",
            )
        )
    db.flush()

    assert player_stats(db, [alex.id])[alex.id]["is_new"] is False


def test_roster_shows_games_played_and_new(client: TestClient, db: Session) -> None:
    seed(db)

    body = client.get(f"/games/{_game_id(db, 0)}").json()

    assert set(body["players"][0]) == {
        "id",
        "name",
        "reputation",
        "games_played",
        "is_new",
        "showed_up",
    }
    jordan = next(p for p in body["players"] if p["name"] == "Jordan")
    assert jordan == {**jordan, "reputation": 100, "games_played": 1, "is_new": True}
    assert body["host_reputation"] == 100
    assert body["effective_min_reputation"] == 80


# ---------- the host's minimum ----------


def test_minimum_above_100_is_rejected(
    client: TestClient, db: Session, auth_headers: Headers
) -> None:
    seed(db)
    body = {
        "sport": "basketball",
        "venue": "Gym",
        "address": "Burnaby",
        "starts_at": (datetime.now(UTC) + timedelta(days=2)).isoformat(),
        "spots": 10,
        "min_reputation": MAX_MIN_REPUTATION + 1,
    }

    response = client.post("/games", json=body, headers=auth_headers("Maya"))

    assert response.status_code == 422
    body["min_reputation"] = MAX_MIN_REPUTATION
    assert client.post("/games", json=body, headers=auth_headers("Maya")).status_code == 201


def test_low_reputation_is_refused_with_the_current_minimum(
    client: TestClient, db: Session, auth_headers: Headers
) -> None:
    seed(db)

    response = client.post(f"/games/{_game_id(db, 0)}/join", headers=auth_headers("Sam"))

    assert response.status_code == 403
    assert "80" in response.json()["detail"] and "75" in response.json()["detail"]


# ---------- the one-step fallback ----------


def test_fallback_applies_only_inside_the_window() -> None:
    starts = datetime(2026, 11, 1, 18, 0, tzinfo=UTC)
    game = Game(
        host_id=1,
        sport="soccer",
        venue="v",
        address="a",
        starts_at=starts,
        spots=10,
        min_reputation=90,
        fallback_min_reputation=60,
        fallback_hours_before_start=10,
    )

    assert effective_min_reputation(game, now=starts - timedelta(hours=11)) == 90
    assert effective_min_reputation(game, now=starts - timedelta(hours=10)) == 60
    assert effective_min_reputation(game, now=starts - timedelta(hours=1)) == 60

    game.fallback_min_reputation = None
    assert effective_min_reputation(game, now=starts - timedelta(hours=1)) == 90


def test_fallback_lets_a_player_in_once_it_kicks_in(
    client: TestClient, db: Session, auth_headers: Headers
) -> None:
    seed(db)
    game_id = _game_id(db, 0)  # tomorrow 18:00, needs 80; Sam has 75
    headers = auth_headers("Maya")

    patch = client.patch(
        f"/games/{game_id}",
        json={"fallback_min_reputation": 70, "fallback_hours_before_start": 48},
        headers=headers,
    )

    assert patch.status_code == 200
    assert client.get(f"/games/{game_id}").json()["effective_min_reputation"] == 70
    sam = auth_headers("Sam")
    client.delete(f"/games/{game_id}/join", headers=sam)  # Sam is seeded in; leave first
    assert client.post(f"/games/{game_id}/join", headers=sam).status_code == 201


def test_fallback_hours_must_be_1_to_168(
    client: TestClient, db: Session, auth_headers: Headers
) -> None:
    seed(db)
    game_id = _game_id(db, 0)

    response = client.patch(
        f"/games/{game_id}",
        json={"fallback_min_reputation": 70, "fallback_hours_before_start": 0},
        headers=auth_headers("Maya"),
    )

    assert response.status_code == 422


# ---------- updated_at ----------


def test_updated_at_moves_on_edit(client: TestClient, db: Session, auth_headers: Headers) -> None:
    seed(db)
    game_id = _game_id(db, 0)
    before = client.get(f"/games/{game_id}").json()["updated_at"]

    client.patch(f"/games/{game_id}", json={"venue": "Moved"}, headers=auth_headers("Maya"))

    after = client.get(f"/games/{game_id}").json()["updated_at"]
    assert after > before
