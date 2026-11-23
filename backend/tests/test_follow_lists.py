from collections.abc import Callable

import pytest
from fastapi.testclient import TestClient
from sqlalchemy import select
from sqlalchemy.orm import Session

from app.models import User
from app.seed import seed

Headers = Callable[[str], dict[str, str]]

# Seed facts used below:
#   Jordan: reputation 100, marked present at the one played game -> games_played 1
#   Sam:    reputation 75 after a no-show there                    -> games_played 0
#   Everyone has fewer than 3 marked or hosted games              -> is_new True

ROW_FIELDS = {"id", "name", "reputation", "games_played", "is_new", "is_following"}


def _id(db: Session, name: str) -> int:
    return db.scalars(select(User.id).where(User.name == name)).one()


def _follow(client: TestClient, db: Session, headers: dict[str, str], *names: str) -> None:
    for name in names:
        assert client.post(f"/users/{_id(db, name)}/follow", headers=headers).status_code == 201


def test_following_lists_the_players_i_follow_newest_first(
    client: TestClient, db: Session, auth_headers: Headers
) -> None:
    seed(db)
    maya = auth_headers("Maya")
    _follow(client, db, maya, "Jordan", "Sam")

    response = client.get("/me/following", headers=maya)

    assert response.status_code == 200
    rows = response.json()
    assert [row["name"] for row in rows] == ["Sam", "Jordan"]
    assert all(set(row) == ROW_FIELDS for row in rows)  # in particular: no email
    assert all(row["is_following"] is True for row in rows)
    sam, jordan = rows
    assert (sam["id"], sam["reputation"], sam["games_played"]) == (_id(db, "Sam"), 75, 0)
    assert (jordan["reputation"], jordan["games_played"], jordan["is_new"]) == (100, 1, True)


def test_followers_lists_who_follows_me_and_who_i_follow_back(
    client: TestClient, db: Session, auth_headers: Headers
) -> None:
    seed(db)
    maya = auth_headers("Maya")
    _follow(client, db, auth_headers("Jordan"), "Maya")
    _follow(client, db, auth_headers("Riley"), "Maya")
    _follow(client, db, maya, "Riley")

    rows = client.get("/me/followers", headers=maya).json()

    assert [(row["name"], row["is_following"]) for row in rows] == [
        ("Riley", True),  # newest follower, and Maya follows Riley back
        ("Jordan", False),
    ]
    assert all(set(row) == ROW_FIELDS for row in rows)


def test_the_two_lists_are_different_directions(
    client: TestClient, db: Session, auth_headers: Headers
) -> None:
    seed(db)
    maya = auth_headers("Maya")
    _follow(client, db, maya, "Jordan")

    assert [r["name"] for r in client.get("/me/following", headers=maya).json()] == ["Jordan"]
    assert client.get("/me/followers", headers=maya).json() == []
    jordan = auth_headers("Jordan")
    assert client.get("/me/following", headers=jordan).json() == []
    assert [r["name"] for r in client.get("/me/followers", headers=jordan).json()] == ["Maya"]


def test_lists_are_empty_for_a_user_with_no_follows(
    client: TestClient, db: Session, auth_headers: Headers
) -> None:
    seed(db)
    _follow(client, db, auth_headers("Maya"), "Jordan")  # someone else's follow

    riley = auth_headers("Riley")

    assert client.get("/me/following", headers=riley).json() == []
    assert client.get("/me/followers", headers=riley).json() == []


def test_unfollowing_removes_the_player_from_both_sides(
    client: TestClient, db: Session, auth_headers: Headers
) -> None:
    seed(db)
    maya = auth_headers("Maya")
    _follow(client, db, maya, "Jordan", "Sam")

    client.delete(f"/users/{_id(db, 'Jordan')}/follow", headers=maya)

    assert [r["name"] for r in client.get("/me/following", headers=maya).json()] == ["Sam"]
    assert client.get("/me/followers", headers=auth_headers("Jordan")).json() == []


@pytest.mark.parametrize("path", ["/me/following", "/me/followers"])
def test_lists_need_a_token(client: TestClient, db: Session, path: str) -> None:
    seed(db)

    assert client.get(path).status_code == 401
