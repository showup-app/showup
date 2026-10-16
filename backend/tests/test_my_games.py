from collections.abc import Callable

from fastapi.testclient import TestClient
from sqlalchemy.orm import Session

from app.models import GameStatus, SignupStatus
from app.seed import GAMES, SIGNUPS, USERS, seed

Headers = Callable[[str], dict[str, str]]


def _expected(name: str, include_past: bool) -> tuple[list[str], list[str]]:
    """Venues the seed says this user hosts and has joined, soonest first."""
    me = USERS.index(name)
    upcoming = [i for i, g in enumerate(GAMES) if include_past or g[4] > 0]
    hosting = [GAMES[i][2] for i in upcoming if GAMES[i][0] == me]
    joined_ids = {g for g, u, s in SIGNUPS if u == me and s == SignupStatus.JOINED}
    joined = [
        GAMES[i][2] for i in upcoming if i in joined_ids and GAMES[i][9] != GameStatus.CANCELLED
    ]
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
