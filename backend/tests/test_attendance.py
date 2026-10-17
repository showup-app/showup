from collections.abc import Callable
from datetime import UTC, datetime, timedelta

from fastapi.testclient import TestClient
from sqlalchemy import select
from sqlalchemy.orm import Session

from app.models import Game, Signup, SignupStatus, User
from app.seed import GAMES, seed

Headers = Callable[[str], dict[str, str]]

# Seed facts: game 6 was played two days ago, host Alex, players Jordan (showed) and Sam
# (no-show, reputation 75). Game 0 is upcoming, host Maya, players Jordan, Sam, Alex.


def _game_id(db: Session, index: int) -> int:
    return db.scalar(select(Game.id).where(Game.venue == GAMES[index][2]))


def _user_id(db: Session, name: str) -> int:
    return db.scalar(select(User.id).where(User.name == name))


def _reputation(db: Session, name: str) -> int:
    db.expire_all()
    return db.scalar(select(User.reputation).where(User.name == name))


def _mark(client: TestClient, headers: dict[str, str], game_id: int, **marks: bool):
    body = {"marks": [{"user_id": int(uid), "showed_up": up} for uid, up in marks.items()]}
    return client.post(f"/games/{game_id}/attendance", json=body, headers=headers)


def test_host_marks_and_reputation_moves(
    client: TestClient, db: Session, auth_headers: Headers
) -> None:
    seed(db)
    game_id, sam = _game_id(db, 6), _user_id(db, "Sam")

    response = _mark(client, auth_headers("Alex"), game_id, **{str(sam): True})

    assert response.status_code == 200
    body = response.json()
    assert body["status"] == "played"
    assert {p["name"]: p["showed_up"] for p in body["players"]} == {"Jordan": True, "Sam": True}
    assert _reputation(db, "Sam") == 100  # 1 show of 1 marked, with the cushion


def test_host_can_flip_a_mark_inside_the_window(
    client: TestClient, db: Session, auth_headers: Headers
) -> None:
    seed(db)
    game_id, jordan = _game_id(db, 6), _user_id(db, "Jordan")

    response = _mark(client, auth_headers("Alex"), game_id, **{str(jordan): False})

    assert response.status_code == 200
    assert _reputation(db, "Jordan") == 75
    assert _reputation(db, "Sam") == 75  # untouched: not in the body


def test_only_the_host_marks(client: TestClient, db: Session, auth_headers: Headers) -> None:
    seed(db)
    game_id, jordan = _game_id(db, 6), _user_id(db, "Jordan")

    response = _mark(client, auth_headers("Jordan"), game_id, **{str(jordan): True})

    assert response.status_code == 403


def test_cannot_mark_before_kickoff(client: TestClient, db: Session, auth_headers: Headers) -> None:
    seed(db)
    game_id, jordan = _game_id(db, 0), _user_id(db, "Jordan")

    response = _mark(client, auth_headers("Maya"), game_id, **{str(jordan): True})

    assert response.status_code == 409
    assert "not started" in response.json()["detail"]


def test_cannot_mark_after_the_window(
    client: TestClient, db: Session, auth_headers: Headers
) -> None:
    seed(db)
    maya, jordan = _user_id(db, "Maya"), _user_id(db, "Jordan")
    old = Game(
        host_id=maya,
        sport="soccer",
        venue="Old Field",
        address="1 Past Lane",
        starts_at=datetime.now(UTC) - timedelta(days=8),
        spots=4,
    )
    db.add(old)
    db.flush()
    db.add(Signup(game_id=old.id, user_id=jordan, status=SignupStatus.JOINED))
    db.commit()

    response = _mark(client, auth_headers("Maya"), old.id, **{str(jordan): True})

    assert response.status_code == 409
    assert "7 days" in response.json()["detail"]


def test_marking_someone_not_on_the_roster_is_422(
    client: TestClient, db: Session, auth_headers: Headers
) -> None:
    seed(db)
    game_id, riley = _game_id(db, 6), _user_id(db, "Riley")

    response = _mark(client, auth_headers("Alex"), game_id, **{str(riley): True})

    assert response.status_code == 422
    assert str(riley) in response.json()["detail"]


def test_duplicate_user_in_body_is_422(
    client: TestClient, db: Session, auth_headers: Headers
) -> None:
    seed(db)
    game_id, jordan = _game_id(db, 6), _user_id(db, "Jordan")

    body = {
        "marks": [{"user_id": jordan, "showed_up": True}, {"user_id": jordan, "showed_up": False}]
    }
    response = client.post(f"/games/{game_id}/attendance", json=body, headers=auth_headers("Alex"))

    assert response.status_code == 422
