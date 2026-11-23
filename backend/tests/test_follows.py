from collections.abc import Callable

import pytest
from fastapi.testclient import TestClient
from sqlalchemy import func, select
from sqlalchemy.exc import IntegrityError
from sqlalchemy.orm import Session

from app.models import Follow, User
from app.security import hash_password
from app.seed import seed

Headers = Callable[[str], dict[str, str]]

# Seed facts used below:
#   users: Maya, Jordan, Sam, Riley, Alex
#   Jordan was marked present at the one played game  -> games_played 1
#   Sam was marked a no-show there                    -> reputation 75, games_played 0
#   Alex hosted that game                             -> games_hosted 1

PUBLIC_FIELDS = {
    "id",
    "name",
    "reputation",
    "games_played",
    "games_hosted",
    "is_new",
    "followers_count",
    "following_count",
    "is_following",
}


def _id(db: Session, name: str) -> int:
    return db.scalars(select(User.id).where(User.name == name)).one()


def _follow_rows(db: Session) -> int:
    return db.scalar(select(func.count()).select_from(Follow)) or 0


def test_follow_returns_the_followed_players_public_profile(
    client: TestClient, db: Session, auth_headers: Headers
) -> None:
    seed(db)
    jordan = _id(db, "Jordan")

    response = client.post(f"/users/{jordan}/follow", headers=auth_headers("Maya"))

    assert response.status_code == 201
    body = response.json()
    assert set(body) == PUBLIC_FIELDS  # in particular: no email
    assert (body["id"], body["name"]) == (jordan, "Jordan")
    assert body["is_following"] is True
    assert (body["followers_count"], body["following_count"]) == (1, 0)
    assert (body["reputation"], body["games_played"], body["games_hosted"]) == (100, 1, 0)
    assert body["is_new"] is True


def test_profile_carries_the_reputation_numbers(
    client: TestClient, db: Session, auth_headers: Headers
) -> None:
    seed(db)

    sam = client.post(f"/users/{_id(db, 'Sam')}/follow", headers=auth_headers("Maya")).json()
    alex = client.post(f"/users/{_id(db, 'Alex')}/follow", headers=auth_headers("Maya")).json()

    assert (sam["reputation"], sam["games_played"]) == (75, 0)
    assert alex["games_hosted"] == 1


def test_following_is_one_way(client: TestClient, db: Session, auth_headers: Headers) -> None:
    seed(db)
    maya, jordan = _id(db, "Maya"), _id(db, "Jordan")
    client.post(f"/users/{jordan}/follow", headers=auth_headers("Maya"))

    # Sam follows Maya and gets Maya's profile: she follows one player and has one follower.
    maya_profile = client.post(f"/users/{maya}/follow", headers=auth_headers("Sam")).json()

    assert (maya_profile["following_count"], maya_profile["followers_count"]) == (1, 1)
    # Jordan never followed Maya back.
    assert (
        db.scalar(select(Follow.id).where(Follow.follower_id == jordan, Follow.followee_id == maya))
        is None
    )
    assert _follow_rows(db) == 2


def test_follow_twice_is_409(client: TestClient, db: Session, auth_headers: Headers) -> None:
    seed(db)
    jordan = _id(db, "Jordan")
    client.post(f"/users/{jordan}/follow", headers=auth_headers("Maya"))

    response = client.post(f"/users/{jordan}/follow", headers=auth_headers("Maya"))

    assert response.status_code == 409
    assert response.json()["detail"] == "You already follow this player"
    assert _follow_rows(db) == 1


def test_follow_yourself_is_422(client: TestClient, db: Session, auth_headers: Headers) -> None:
    seed(db)

    response = client.post(f"/users/{_id(db, 'Maya')}/follow", headers=auth_headers("Maya"))

    assert response.status_code == 422
    assert response.json()["detail"] == "You cannot follow yourself"
    assert _follow_rows(db) == 0


def test_follow_unknown_user_is_404(client: TestClient, db: Session, auth_headers: Headers) -> None:
    seed(db)

    response = client.post("/users/999999/follow", headers=auth_headers("Maya"))

    assert response.status_code == 404
    assert response.json()["detail"] == "User not found"


@pytest.mark.parametrize("method", ["post", "delete"])
def test_follow_and_unfollow_need_a_token(client: TestClient, db: Session, method: str) -> None:
    seed(db)

    response = client.request(method, f"/users/{_id(db, 'Jordan')}/follow")

    assert response.status_code == 401
    assert _follow_rows(db) == 0


def test_unfollow_removes_the_follow(
    client: TestClient, db: Session, auth_headers: Headers
) -> None:
    seed(db)
    jordan = _id(db, "Jordan")
    client.post(f"/users/{jordan}/follow", headers=auth_headers("Maya"))

    response = client.delete(f"/users/{jordan}/follow", headers=auth_headers("Maya"))

    assert response.status_code == 200
    body = response.json()
    assert body["is_following"] is False
    assert body["followers_count"] == 0
    assert _follow_rows(db) == 0


def test_unfollow_removes_only_my_follow(
    client: TestClient, db: Session, auth_headers: Headers
) -> None:
    seed(db)
    jordan = _id(db, "Jordan")
    client.post(f"/users/{jordan}/follow", headers=auth_headers("Maya"))
    client.post(f"/users/{jordan}/follow", headers=auth_headers("Sam"))

    body = client.delete(f"/users/{jordan}/follow", headers=auth_headers("Maya")).json()

    assert body["followers_count"] == 1
    remaining = db.scalars(select(Follow.follower_id)).all()
    assert remaining == [_id(db, "Sam")]


def test_unfollow_when_not_following_is_404(
    client: TestClient, db: Session, auth_headers: Headers
) -> None:
    seed(db)

    response = client.delete(f"/users/{_id(db, 'Jordan')}/follow", headers=auth_headers("Maya"))

    assert response.status_code == 404
    assert response.json()["detail"] == "You do not follow this player"


def test_unfollow_unknown_user_is_404(
    client: TestClient, db: Session, auth_headers: Headers
) -> None:
    seed(db)

    response = client.delete("/users/999999/follow", headers=auth_headers("Maya"))

    assert response.status_code == 404
    assert response.json()["detail"] == "User not found"


def test_follow_again_after_unfollowing(
    client: TestClient, db: Session, auth_headers: Headers
) -> None:
    seed(db)
    jordan = _id(db, "Jordan")
    client.post(f"/users/{jordan}/follow", headers=auth_headers("Maya"))
    client.delete(f"/users/{jordan}/follow", headers=auth_headers("Maya"))

    response = client.post(f"/users/{jordan}/follow", headers=auth_headers("Maya"))

    assert response.status_code == 201
    assert response.json()["followers_count"] == 1


def test_the_table_itself_refuses_a_self_follow_and_a_duplicate(db: Session) -> None:
    """The endpoint checks these first; the constraints are what holds if a later code path
    forgets to."""
    seed(db)
    maya, jordan = _id(db, "Maya"), _id(db, "Jordan")

    db.add(Follow(follower_id=maya, followee_id=maya))
    with pytest.raises(IntegrityError):
        db.commit()
    db.rollback()

    db.add(Follow(follower_id=maya, followee_id=jordan))
    db.commit()
    db.add(Follow(follower_id=maya, followee_id=jordan))
    with pytest.raises(IntegrityError):
        db.commit()
    db.rollback()

    assert _follow_rows(db) == 1


def test_seed_can_run_again_after_seed_users_were_followed(
    client: TestClient, db: Session, auth_headers: Headers
) -> None:
    """Re-seeding deletes and recreates the seed users. Follows that point at them, in either
    direction, go with them instead of blocking the delete."""
    seed(db)
    db.add(User(email="real@example.com", password_hash=hash_password("x" * 12), name="Real"))
    db.commit()
    real = _id(db, "Real")
    client.post(f"/users/{_id(db, 'Jordan')}/follow", headers=auth_headers("Real"))
    client.post(f"/users/{real}/follow", headers=auth_headers("Maya"))
    assert _follow_rows(db) == 2

    seed(db)

    assert _follow_rows(db) == 0
    assert db.get(User, real) is not None
