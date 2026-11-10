from collections.abc import Callable

from fastapi.testclient import TestClient
from sqlalchemy import select
from sqlalchemy.orm import Session

from app.models import Game, Signup, SignupStatus, User
from app.seed import GAMES, seed

Headers = Callable[[str], dict[str, str]]


def _game_id(db: Session, index: int) -> int:
    return db.scalar(select(Game.id).where(Game.venue == GAMES[index][2]))


def _user_id(db: Session, name: str) -> int:
    return db.scalar(select(User.id).where(User.name == name))


# Seed facts: game 0 is hosted by Maya with Jordan, Sam and Alex joined; game 5 is Maya's and
# full; game 6 was played; game 7 is cancelled.


def test_host_removes_player(client: TestClient, db: Session, auth_headers: Headers) -> None:
    seed(db)
    game_id, jordan = _game_id(db, 0), _user_id(db, "Jordan")
    before = client.get(f"/games/{game_id}").json()["spots_left"]

    response = client.delete(f"/games/{game_id}/players/{jordan}", headers=auth_headers("Maya"))

    assert response.status_code == 200
    body = response.json()
    assert "Jordan" not in {p["name"] for p in body["players"]}
    assert body["spots_left"] == before + 1
    signup = db.scalar(select(Signup).where(Signup.game_id == game_id, Signup.user_id == jordan))
    assert signup.status == SignupStatus.REMOVED


def test_removed_player_cannot_rejoin(
    client: TestClient, db: Session, auth_headers: Headers
) -> None:
    seed(db)
    game_id, jordan = _game_id(db, 0), _user_id(db, "Jordan")
    client.delete(f"/games/{game_id}/players/{jordan}", headers=auth_headers("Maya"))

    response = client.post(f"/games/{game_id}/join", headers=auth_headers("Jordan"))

    assert response.status_code == 403
    assert "removed" in response.json()["detail"]


def test_only_host_can_remove(client: TestClient, db: Session, auth_headers: Headers) -> None:
    seed(db)
    game_id, sam = _game_id(db, 0), _user_id(db, "Sam")

    response = client.delete(f"/games/{game_id}/players/{sam}", headers=auth_headers("Jordan"))

    assert response.status_code == 403
    assert "Sam" in {p["name"] for p in client.get(f"/games/{game_id}").json()["players"]}


def test_remove_requires_token(client: TestClient, db: Session) -> None:
    seed(db)
    game_id, sam = _game_id(db, 0), _user_id(db, "Sam")

    assert client.delete(f"/games/{game_id}/players/{sam}").status_code == 401


def test_remove_someone_not_in_game_is_404(
    client: TestClient, db: Session, auth_headers: Headers
) -> None:
    seed(db)
    game_id, riley = _game_id(db, 0), _user_id(db, "Riley")

    response = client.delete(f"/games/{game_id}/players/{riley}", headers=auth_headers("Maya"))

    assert response.status_code == 404
    missing = client.delete(f"/games/{game_id}/players/999999", headers=auth_headers("Maya"))
    assert missing.status_code == 404


def test_remove_twice_is_404(client: TestClient, db: Session, auth_headers: Headers) -> None:
    seed(db)
    game_id, jordan = _game_id(db, 0), _user_id(db, "Jordan")
    client.delete(f"/games/{game_id}/players/{jordan}", headers=auth_headers("Maya"))

    again = client.delete(f"/games/{game_id}/players/{jordan}", headers=auth_headers("Maya"))
    assert again.status_code == 404


def test_remove_from_full_game_reopens_it(
    client: TestClient, db: Session, auth_headers: Headers
) -> None:
    seed(db)
    game_id = _game_id(db, 5)
    detail = client.get(f"/games/{game_id}").json()
    assert detail["status"] == "full"
    victim = detail["players"][0]["id"]

    body = client.delete(f"/games/{game_id}/players/{victim}", headers=auth_headers("Maya")).json()

    assert body["status"] == "open"
    assert body["spots_left"] == 1


def test_remove_after_kickoff_is_409(
    client: TestClient, db: Session, auth_headers: Headers
) -> None:
    seed(db)
    game_id = _game_id(db, 6)
    host = client.get(f"/games/{game_id}").json()["host_name"]
    player = client.get(f"/games/{game_id}").json()["players"][0]["id"]

    response = client.delete(f"/games/{game_id}/players/{player}", headers=auth_headers(host))

    assert response.status_code == 409
    assert "started" in response.json()["detail"]


def test_remove_from_cancelled_game_is_409(
    client: TestClient, db: Session, auth_headers: Headers
) -> None:
    seed(db)
    game_id = _game_id(db, 7)
    host = client.get(f"/games/{game_id}").json()["host_name"]
    jordan = _user_id(db, "Jordan")

    response = client.delete(f"/games/{game_id}/players/{jordan}", headers=auth_headers(host))

    assert response.status_code == 409
