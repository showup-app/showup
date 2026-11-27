from collections.abc import Callable
from datetime import UTC, datetime, timedelta

from fastapi.testclient import TestClient
from sqlalchemy import select
from sqlalchemy.orm import Session

from app.models import Game
from app.seed import GAMES, seed

Headers = Callable[[str], dict[str, str]]


def _future(days: int = 3) -> str:
    return (datetime.now(UTC) + timedelta(days=days)).isoformat()


def _game_id(db: Session, index: int) -> int:
    value = db.scalar(select(Game.id).where(Game.venue == GAMES[index][2]))
    assert value is not None
    return value


VALID_BODY = {
    "sport": "Basketball",
    "venue": "Test Gym",
    "address": "1 Test St, Burnaby",
    "starts_at": _future(),
    "spots": 10,
    "cost": "5.00",
    "min_reputation": 40,
}


# ---------- POST /games ----------


def test_create_game_makes_caller_the_host(
    client: TestClient, db: Session, auth_headers: Headers
) -> None:
    seed(db)

    response = client.post("/games", json=VALID_BODY, headers=auth_headers("Maya"))

    assert response.status_code == 201
    body = response.json()
    assert body["sport"] == "basketball"  # normalised to lowercase
    assert body["status"] == "open"
    assert body["cost"] == 5.0
    game = db.scalar(select(Game).where(Game.id == body["id"]))
    assert game is not None
    assert game.host.name == "Maya"


def test_create_game_requires_token(client: TestClient, db: Session) -> None:
    seed(db)

    response = client.post("/games", json=VALID_BODY)

    assert response.status_code == 401
    assert response.headers["WWW-Authenticate"] == "Bearer"


def test_create_game_rejects_bad_token(client: TestClient, db: Session) -> None:
    seed(db)

    response = client.post(
        "/games", json=VALID_BODY, headers={"Authorization": "Bearer not-a-real-token"}
    )

    assert response.status_code == 401


def test_create_game_validates_fields(
    client: TestClient, db: Session, auth_headers: Headers
) -> None:
    seed(db)
    headers = auth_headers("Maya")
    bad_bodies = [
        {**VALID_BODY, "sport": "curling"},
        {**VALID_BODY, "spots": 1},
        {**VALID_BODY, "spots": 31},
        {**VALID_BODY, "cost": "-1"},
        {**VALID_BODY, "min_reputation": 101},
        {**VALID_BODY, "starts_at": (datetime.now(UTC) - timedelta(hours=1)).isoformat()},
        {**VALID_BODY, "starts_at": "2030-01-01T18:00:00"},  # no timezone
        {**VALID_BODY, "venue": ""},
        {**VALID_BODY, "unknown_field": 1},
    ]

    for body in bad_bodies:
        response = client.post("/games", json=body, headers=headers)
        assert response.status_code == 422, body


# ---------- PATCH /games/{id} ----------


def test_host_can_update_venue(client: TestClient, db: Session, auth_headers: Headers) -> None:
    seed(db)
    game_id = _game_id(db, 0)  # hosted by Maya

    response = client.patch(
        f"/games/{game_id}", json={"venue": "New Gym"}, headers=auth_headers("Maya")
    )

    assert response.status_code == 200
    assert response.json()["venue"] == "New Gym"
    assert response.json()["sport"] == "basketball"  # untouched


def test_non_host_cannot_update(client: TestClient, db: Session, auth_headers: Headers) -> None:
    seed(db)
    game_id = _game_id(db, 0)

    response = client.patch(
        f"/games/{game_id}", json={"venue": "Hijacked"}, headers=auth_headers("Jordan")
    )

    assert response.status_code == 403


def test_update_empty_body_is_422(client: TestClient, db: Session, auth_headers: Headers) -> None:
    seed(db)
    game_id = _game_id(db, 0)

    response = client.patch(f"/games/{game_id}", json={}, headers=auth_headers("Maya"))

    assert response.status_code == 422


def test_shrinking_spots_below_roster_marks_full(
    client: TestClient, db: Session, auth_headers: Headers
) -> None:
    seed(db)
    game_id = _game_id(db, 0)  # 3 players joined

    response = client.patch(f"/games/{game_id}", json={"spots": 3}, headers=auth_headers("Maya"))

    assert response.status_code == 200
    assert response.json()["status"] == "full"


# ---------- POST /games/{id}/cancel ----------


def test_host_can_cancel_and_game_leaves_the_list(
    client: TestClient, db: Session, auth_headers: Headers
) -> None:
    seed(db)
    game_id = _game_id(db, 0)

    response = client.post(f"/games/{game_id}/cancel", headers=auth_headers("Maya"))

    assert response.status_code == 200
    assert response.json()["status"] == "cancelled"
    assert game_id not in {g["id"] for g in client.get("/games").json()}


def test_cancel_twice_is_409(client: TestClient, db: Session, auth_headers: Headers) -> None:
    seed(db)
    game_id = _game_id(db, 0)
    headers = auth_headers("Maya")
    client.post(f"/games/{game_id}/cancel", headers=headers)

    response = client.post(f"/games/{game_id}/cancel", headers=headers)

    assert response.status_code == 409


def test_update_cancelled_game_is_409(
    client: TestClient, db: Session, auth_headers: Headers
) -> None:
    seed(db)
    game_id = _game_id(db, 7)  # seeded as cancelled, hosted by Jordan

    response = client.patch(
        f"/games/{game_id}", json={"venue": "Nope"}, headers=auth_headers("Jordan")
    )

    assert response.status_code == 409


def test_non_host_cannot_cancel(client: TestClient, db: Session, auth_headers: Headers) -> None:
    seed(db)
    game_id = _game_id(db, 0)

    response = client.post(f"/games/{game_id}/cancel", headers=auth_headers("Sam"))

    assert response.status_code == 403
