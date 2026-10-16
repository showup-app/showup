from collections.abc import Callable

from fastapi.testclient import TestClient
from sqlalchemy import select
from sqlalchemy.orm import Session

from app.models import Game
from app.seed import GAMES, seed

Headers = Callable[[str], dict[str, str]]


def _game_id(db: Session, index: int) -> int:
    return db.scalar(select(Game.id).where(Game.venue == GAMES[index][2]))


# Seed facts used below:
#   game 0: BCIT Gym basketball, host Maya, 10 spots, min rep 80, players Jordan, Sam, Alex
#   game 1: Bonsor basketball, host Jordan, 8 spots, min rep 0, player Maya
#   game 2: Central Park soccer, host Sam, Riley was removed
#   game 5: badminton, host Maya, 4 spots, FULL
#   game 6: played (in the past)
#   game 7: cancelled
#   reputations: everyone 100 except Sam, 75 (one no-show at the played game)


def test_join_takes_a_spot(client: TestClient, db: Session, auth_headers: Headers) -> None:
    seed(db)
    game_id = _game_id(db, 1)
    before = client.get(f"/games/{game_id}").json()["spots_left"]

    response = client.post(f"/games/{game_id}/join", headers=auth_headers("Sam"))

    assert response.status_code == 201
    body = response.json()
    assert body["spots_left"] == before - 1
    assert "Sam" in {p["name"] for p in body["players"]}


def test_join_twice_is_409(client: TestClient, db: Session, auth_headers: Headers) -> None:
    seed(db)
    game_id = _game_id(db, 0)

    response = client.post(f"/games/{game_id}/join", headers=auth_headers("Jordan"))

    assert response.status_code == 409
    assert "already joined" in response.json()["detail"]


def test_join_full_game_is_409(client: TestClient, db: Session, auth_headers: Headers) -> None:
    seed(db)
    game_id = _game_id(db, 5)  # 4 of 4; Maya hosts, the other four are in

    # Create a sixth user by posting nothing: reuse host of another game who is not in this one.
    # Everyone seeded is either host or joined, so spin up a fresh user.
    from app.models import User

    db.add(User(email="late@test.local", password_hash="x", name="Late", reputation=90))
    db.commit()

    response = client.post(f"/games/{game_id}/join", headers=auth_headers("Late"))

    assert response.status_code == 409
    assert response.json()["detail"] == "Game is full"


def test_last_spot_marks_game_full_and_leave_reopens_it(
    client: TestClient, db: Session, auth_headers: Headers
) -> None:
    seed(db)
    game_id = _game_id(db, 1)  # 8 spots, 1 player
    from app.models import User

    names = [f"P{i}" for i in range(7)]
    db.add_all(
        User(email=f"{n.lower()}@test.local", password_hash="x", name=n, reputation=50)
        for n in names
    )
    db.commit()

    for n in names:
        assert client.post(f"/games/{game_id}/join", headers=auth_headers(n)).status_code == 201
    assert client.get(f"/games/{game_id}").json()["status"] == "full"
    assert client.get(f"/games/{game_id}").json()["spots_left"] == 0

    response = client.delete(f"/games/{game_id}/join", headers=auth_headers("P0"))

    assert response.status_code == 200
    assert response.json()["status"] == "open"
    assert response.json()["spots_left"] == 1


def test_host_cannot_join_own_game(client: TestClient, db: Session, auth_headers: Headers) -> None:
    seed(db)
    game_id = _game_id(db, 0)

    response = client.post(f"/games/{game_id}/join", headers=auth_headers("Maya"))

    assert response.status_code == 409


def test_low_reputation_is_403(client: TestClient, db: Session, auth_headers: Headers) -> None:
    seed(db)
    game_id = _game_id(db, 0)  # needs 80; Sam has 75 after a no-show
    client.delete(f"/games/{game_id}/join", headers=auth_headers("Sam"))  # Sam is seeded in

    response = client.post(f"/games/{game_id}/join", headers=auth_headers("Sam"))

    assert response.status_code == 403
    assert "reputation" in response.json()["detail"]


def test_removed_player_cannot_rejoin(
    client: TestClient, db: Session, auth_headers: Headers
) -> None:
    seed(db)
    game_id = _game_id(db, 2)  # Riley was removed by the host

    response = client.post(f"/games/{game_id}/join", headers=auth_headers("Riley"))

    assert response.status_code == 403
    assert "removed" in response.json()["detail"]


def test_join_cancelled_or_past_game_is_409(
    client: TestClient, db: Session, auth_headers: Headers
) -> None:
    seed(db)

    cancelled = client.post(f"/games/{_game_id(db, 7)}/join", headers=auth_headers("Sam"))
    past = client.post(f"/games/{_game_id(db, 6)}/join", headers=auth_headers("Riley"))

    assert cancelled.status_code == 409
    assert past.status_code == 409


def test_join_requires_token(client: TestClient, db: Session) -> None:
    seed(db)

    response = client.post(f"/games/{_game_id(db, 1)}/join")

    assert response.status_code == 401


def test_leave_when_not_joined_is_404(
    client: TestClient, db: Session, auth_headers: Headers
) -> None:
    seed(db)

    response = client.delete(f"/games/{_game_id(db, 1)}/join", headers=auth_headers("Sam"))

    assert response.status_code == 404


def test_leave_then_rejoin_works(client: TestClient, db: Session, auth_headers: Headers) -> None:
    seed(db)
    game_id = _game_id(db, 0)
    headers = auth_headers("Jordan")

    assert client.delete(f"/games/{game_id}/join", headers=headers).status_code == 200
    assert "Jordan" not in {p["name"] for p in client.get(f"/games/{game_id}").json()["players"]}
    assert client.post(f"/games/{game_id}/join", headers=headers).status_code == 201


def test_leave_after_kickoff_is_409(client: TestClient, db: Session, auth_headers: Headers) -> None:
    seed(db)

    response = client.delete(f"/games/{_game_id(db, 6)}/join", headers=auth_headers("Jordan"))

    assert response.status_code == 409
    assert response.json()["detail"] == "Game has already started"
