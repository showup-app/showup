from collections.abc import Callable

from fastapi.testclient import TestClient
from sqlalchemy import select
from sqlalchemy.orm import Session

from app.models import User
from app.seed import seed

Headers = Callable[[str], dict[str, str]]

# Seed facts used below:
#   Jordan: reputation 100, marked present at the one played game -> games_played 1, still New
#   Sam:    reputation 75 after a no-show there                    -> games_played 0
#   Alex:   hosted that game                                       -> games_hosted 1


def _id(db: Session, name: str) -> int:
    return db.scalars(select(User.id).where(User.name == name)).one()


def test_profile_without_a_token(client: TestClient, db: Session) -> None:
    seed(db)
    jordan = _id(db, "Jordan")

    response = client.get(f"/users/{jordan}")

    assert response.status_code == 200
    assert response.json() == {
        "id": jordan,
        "name": "Jordan",
        "reputation": 100,
        "games_played": 1,
        "games_hosted": 0,
        "is_new": True,
        "followers_count": 0,
        "following_count": 0,
        "is_following": False,
    }


def test_profile_never_shows_private_fields(client: TestClient, db: Session) -> None:
    seed(db)

    body = client.get(f"/users/{_id(db, 'Sam')}").json()

    assert "email" not in body
    assert "password_hash" not in body
    assert (body["reputation"], body["games_played"]) == (75, 0)


def test_profile_counts_hosted_games(client: TestClient, db: Session) -> None:
    seed(db)

    assert client.get(f"/users/{_id(db, 'Alex')}").json()["games_hosted"] == 1


def test_profile_shows_counts_and_whether_the_caller_follows(
    client: TestClient, db: Session, auth_headers: Headers
) -> None:
    seed(db)
    maya, jordan = _id(db, "Maya"), _id(db, "Jordan")
    client.post(f"/users/{jordan}/follow", headers=auth_headers("Maya"))
    client.post(f"/users/{jordan}/follow", headers=auth_headers("Sam"))

    as_maya = client.get(f"/users/{jordan}", headers=auth_headers("Maya")).json()
    as_riley = client.get(f"/users/{jordan}", headers=auth_headers("Riley")).json()
    anonymous = client.get(f"/users/{jordan}").json()
    maya_profile = client.get(f"/users/{maya}", headers=auth_headers("Jordan")).json()

    assert (as_maya["followers_count"], as_maya["is_following"]) == (2, True)
    assert (as_riley["followers_count"], as_riley["is_following"]) == (2, False)
    assert (anonymous["followers_count"], anonymous["is_following"]) == (2, False)
    # Maya follows Jordan, not the other way round.
    assert (maya_profile["following_count"], maya_profile["is_following"]) == (1, False)


def test_own_profile_is_not_following_itself(
    client: TestClient, db: Session, auth_headers: Headers
) -> None:
    seed(db)

    body = client.get(f"/users/{_id(db, 'Maya')}", headers=auth_headers("Maya")).json()

    assert body["name"] == "Maya"
    assert body["is_following"] is False


def test_unknown_user_is_404(client: TestClient, db: Session) -> None:
    seed(db)

    response = client.get("/users/999999")

    assert response.status_code == 404
    assert response.json()["detail"] == "User not found"


def test_a_bad_token_is_401_not_an_anonymous_view(client: TestClient, db: Session) -> None:
    seed(db)

    response = client.get(
        f"/users/{_id(db, 'Jordan')}", headers={"Authorization": "Bearer not-a-token"}
    )

    assert response.status_code == 401
