from fastapi.testclient import TestClient
from sqlalchemy import select
from sqlalchemy.orm import Session

from app.models import Game, SignupStatus, User
from app.seed import ATTENDANCE, GAMES, SIGNUPS, USERS, seed


def _game_id(db: Session, index: int) -> int:
    """Id of the seeded game at GAMES[index], found by its venue."""
    return db.scalar(select(Game.id).where(Game.venue == GAMES[index][2]))


def test_detail_has_host_players_and_spots_left(client: TestClient, db: Session) -> None:
    seed(db)
    game_id = _game_id(db, 0)
    joined = [u for g, u, s in SIGNUPS if g == 0 and s == SignupStatus.JOINED]

    body = client.get(f"/games/{game_id}").json()

    assert body["id"] == game_id
    assert body["host_name"] == USERS[GAMES[0][0]]
    assert [p["name"] for p in body["players"]] == [USERS[u] for u in joined]
    assert body["spots_left"] == GAMES[0][6] - len(joined)
    assert set(body["players"][0]) == {
        "id",
        "name",
        "reputation",
        "games_played",
        "is_new",
        "showed_up",
    }


def test_detail_excludes_removed_players(client: TestClient, db: Session) -> None:
    seed(db)
    game_id = _game_id(db, 2)

    body = client.get(f"/games/{game_id}").json()

    assert [p["name"] for p in body["players"]] == ["Maya"]
    assert "Riley" not in {p["name"] for p in body["players"]}


def test_detail_of_full_game_has_zero_spots_left(client: TestClient, db: Session) -> None:
    seed(db)
    game_id = _game_id(db, 5)

    body = client.get(f"/games/{game_id}").json()

    assert len(body["players"]) == body["spots"] == 4
    assert body["spots_left"] == 0


def test_detail_unknown_game_is_404(client: TestClient, db: Session) -> None:
    seed(db)

    response = client.get("/games/999999")

    assert response.status_code == 404
    assert response.json() == {"detail": "Game not found"}


def test_seed_counts_include_signups(db: Session) -> None:
    counts = seed(db)

    assert counts == {
        "users": len(USERS),
        "games": len(GAMES),
        "signups": len(SIGNUPS),
        "attendance": len(ATTENDANCE),
    }
    assert db.scalar(select(User).where(User.name == "Maya")) is not None
