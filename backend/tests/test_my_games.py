from collections.abc import Callable

from fastapi.testclient import TestClient
from sqlalchemy import select
from sqlalchemy.orm import Session

from app.models import Game, GameStatus, Signup, SignupStatus, User
from app.seed import GAMES, SIGNUPS, USERS, seed

Headers = Callable[[str], dict[str, str]]


def _expected(name: str, include_past: bool) -> tuple[list[str], list[str]]:
    """Venues the seed says this user hosts and has joined, soonest first."""
    me = USERS.index(name)
    upcoming = [i for i, g in enumerate(GAMES) if include_past or g[4] > 0]
    hosting = [GAMES[i][2] for i in upcoming if GAMES[i][0] == me]
    joined_ids = {g for g, u, s in SIGNUPS if u == me and s == SignupStatus.JOINED}
    joined = [GAMES[i][2] for i in upcoming if i in joined_ids]
    key = lambda v: GAMES[[g[2] for g in GAMES].index(v)][4]  # noqa: E731
    return sorted(hosting, key=key), sorted(joined, key=key)


def test_my_games_splits_hosting_and_joined(
    client: TestClient, db: Session, auth_headers: Headers
) -> None:
    seed(db)

    body = client.get("/me/games", headers=auth_headers("Maya")).json()

    hosting, joined = _expected("Maya", include_past=False)
    assert [g["venue"] for g in body["hosting"]] == hosting
    assert [g["venue"] for g in body["joined"]] == joined
    assert hosting and joined
    assert set(body["hosting"][0]) >= {"host_name", "host_reputation", "spots_left"}


def test_my_games_include_past_adds_played_games(
    client: TestClient, db: Session, auth_headers: Headers
) -> None:
    seed(db)

    without = client.get("/me/games", headers=auth_headers("Jordan")).json()
    with_past = client.get(
        "/me/games", params={"include_past": "true"}, headers=auth_headers("Jordan")
    ).json()

    _, joined_all = _expected("Jordan", include_past=True)
    assert [g["venue"] for g in with_past["joined"]] == joined_all
    assert len(with_past["joined"]) > len(without["joined"])


def test_my_games_requires_token(client: TestClient, db: Session) -> None:
    assert client.get("/me/games").status_code == 401


def test_my_games_keeps_cancelled_games_with_their_status(
    client: TestClient, db: Session, auth_headers: Headers
) -> None:
    """A player must see that a game they joined was cancelled, not watch it vanish."""
    seed(db)
    index, game = next((i, g) for i, g in enumerate(GAMES) if g[9] == GameStatus.CANCELLED)
    cancelled, host = game[2], USERS[game[0]]
    player = next(n for n in USERS if n != host)
    game_id = db.scalar(select(Game.id).where(Game.venue == cancelled))
    user_id = db.scalar(select(User.id).where(User.name == player))
    db.add(Signup(game_id=game_id, user_id=user_id, status=SignupStatus.JOINED))
    db.commit()

    hosting = client.get("/me/games", headers=auth_headers(host)).json()["hosting"]
    joined = client.get("/me/games", headers=auth_headers(player)).json()["joined"]

    assert {g["venue"]: g["status"] for g in hosting}[cancelled] == "cancelled"
    assert {g["venue"]: g["status"] for g in joined}[cancelled] == "cancelled"


def _row(rows: list[dict], venue: str) -> dict:
    return next(g for g in rows if g["venue"] == venue)


def test_my_games_rows_carry_attendance(
    client: TestClient, db: Session, auth_headers: Headers
) -> None:
    """Seed: the played game (index 6) is Alex's; Jordan was marked present, Sam a no-show."""
    seed(db)
    played, upcoming = GAMES[6][2], GAMES[0][2]

    hosting = client.get("/me/games?include_past=true", headers=auth_headers("Alex")).json()[
        "hosting"
    ]
    jordan = client.get("/me/games?include_past=true", headers=auth_headers("Jordan")).json()[
        "joined"
    ]
    sam = client.get("/me/games?include_past=true", headers=auth_headers("Sam")).json()["joined"]

    host_row = _row(hosting, played)
    assert (host_row["marked_count"], host_row["showed_up_count"]) == (2, 1)
    assert host_row["my_showed_up"] is None  # the host is not marked
    assert _row(jordan, played)["my_showed_up"] is True
    assert _row(sam, played)["my_showed_up"] is False
    future = _row(jordan, upcoming)
    assert (future["marked_count"], future["showed_up_count"], future["my_showed_up"]) == (
        0,
        0,
        None,
    )


def test_explore_rows_have_no_mark_without_a_token(client: TestClient, db: Session) -> None:
    seed(db)

    rows = client.get("/games?include_past=true").json()

    played = _row(rows, GAMES[6][2])
    assert (played["marked_count"], played["showed_up_count"]) == (2, 1)
    assert all(g["my_showed_up"] is None for g in rows)
