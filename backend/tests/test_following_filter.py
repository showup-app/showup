from collections.abc import Callable

from fastapi.testclient import TestClient
from sqlalchemy import select
from sqlalchemy.orm import Session

from app.models import Game, User
from app.seed import GAMES, seed

Headers = Callable[[str], dict[str, str]]

# Seed facts used below (game index: venue, host, joined players):
#   0 BCIT Gym               basketball  Maya     Jordan, Sam, Alex   (in 1 day)
#   1 Bonsor Rec Centre      basketball  Jordan   Maya                (in 3 days)
#   2 Central Park Turf      soccer      Sam      Maya; Riley REMOVED (in 2 days)
#   3 Trillium Park          soccer      Alex     nobody              (in 5 days)
#   4 Kitsilano Beach Courts volleyball  Riley    nobody              (in 4 days)
#   5 ClearOne Badminton     badminton   Maya     Jordan, Sam, Riley, Alex (in 6 days, full)
#   6 Hillcrest Centre       basketball  Alex     Jordan, Sam         (2 days ago, played)
#   7 Burnaby Lake Fields    soccer      Jordan   nobody              (cancelled)

NOBODY = {"count": 0, "names": []}


def _id(db: Session, name: str) -> int:
    return db.scalars(select(User.id).where(User.name == name)).one()


def _game_id(db: Session, index: int) -> int:
    return db.scalars(select(Game.id).where(Game.venue == GAMES[index][2])).one()


def _follow(client: TestClient, db: Session, headers: dict[str, str], *names: str) -> None:
    for name in names:
        assert client.post(f"/users/{_id(db, name)}/follow", headers=headers).status_code == 201


def _venues(rows: list[dict]) -> list[str]:
    return [row["venue"] for row in rows]


def _by_venue(rows: list[dict]) -> dict[str, dict]:
    return {row["venue"]: row["following_in_game"] for row in rows}


def test_filter_returns_games_a_followed_player_hosts_or_joined(
    client: TestClient, db: Session, auth_headers: Headers
) -> None:
    seed(db)
    riley = auth_headers("Riley")
    _follow(client, db, riley, "Jordan")

    rows = client.get("/games", params={"following": "true"}, headers=riley).json()

    # Jordan joined BCIT Gym and the badminton game and hosts Bonsor. Soonest first.
    # His cancelled game and the played one are left out, as in the normal list.
    assert _venues(rows) == ["BCIT Gym", "Bonsor Rec Centre", "ClearOne Badminton"]


def test_filter_with_include_past_adds_the_played_game(
    client: TestClient, db: Session, auth_headers: Headers
) -> None:
    seed(db)
    riley = auth_headers("Riley")
    _follow(client, db, riley, "Jordan")

    rows = client.get(
        "/games", params={"following": "true", "include_past": "true"}, headers=riley
    ).json()

    assert _venues(rows) == [
        "Hillcrest Centre",
        "BCIT Gym",
        "Bonsor Rec Centre",
        "ClearOne Badminton",
    ]


def test_filter_combines_with_the_sport_filter(
    client: TestClient, db: Session, auth_headers: Headers
) -> None:
    seed(db)
    riley = auth_headers("Riley")
    _follow(client, db, riley, "Jordan")

    rows = client.get(
        "/games", params={"following": "true", "sport": "basketball"}, headers=riley
    ).json()

    assert _venues(rows) == ["BCIT Gym", "Bonsor Rec Centre"]


def test_filter_ignores_a_player_the_host_removed(
    client: TestClient, db: Session, auth_headers: Headers
) -> None:
    seed(db)
    maya = auth_headers("Maya")
    _follow(client, db, maya, "Riley")

    rows = client.get("/games", params={"following": "true"}, headers=maya).json()

    # Riley hosts the volleyball game and is in the badminton game. Riley was removed from
    # Central Park Turf, so that game is not one "Riley is in".
    assert _venues(rows) == ["Kitsilano Beach Courts", "ClearOne Badminton"]


def test_filter_is_empty_when_following_nobody(
    client: TestClient, db: Session, auth_headers: Headers
) -> None:
    seed(db)

    response = client.get("/games", params={"following": "true"}, headers=auth_headers("Riley"))

    assert response.status_code == 200
    assert response.json() == []


def test_filter_without_a_token_is_401(client: TestClient, db: Session) -> None:
    seed(db)

    response = client.get("/games", params={"following": "true"})

    assert response.status_code == 401
    assert response.headers["WWW-Authenticate"] == "Bearer"


def test_rows_say_which_followed_players_are_in_each_game(
    client: TestClient, db: Session, auth_headers: Headers
) -> None:
    seed(db)
    riley = auth_headers("Riley")
    _follow(client, db, riley, "Jordan", "Sam")

    rows = _by_venue(client.get("/games", headers=riley).json())

    assert rows["BCIT Gym"] == {"count": 2, "names": ["Jordan", "Sam"]}  # both joined
    assert rows["Bonsor Rec Centre"] == {"count": 1, "names": ["Jordan"]}  # Jordan hosts
    assert rows["Central Park Turf"] == {"count": 1, "names": ["Sam"]}  # Sam hosts
    assert rows["Trillium Park"] == NOBODY
    assert rows["Kitsilano Beach Courts"] == NOBODY  # Riley's own game


def test_names_stop_at_two_host_first_and_count_keeps_the_total(
    client: TestClient, db: Session, auth_headers: Headers
) -> None:
    seed(db)
    riley = auth_headers("Riley")
    _follow(client, db, riley, "Alex", "Sam", "Jordan", "Maya")

    rows = _by_venue(client.get("/games", headers=riley).json())

    # BCIT Gym: Maya hosts; Jordan, Sam and Alex joined in that order.
    assert rows["BCIT Gym"] == {"count": 4, "names": ["Maya", "Jordan"]}


def test_rows_without_a_token_name_nobody(client: TestClient, db: Session) -> None:
    seed(db)

    rows = client.get("/games").json()

    assert rows
    assert all(row["following_in_game"] == NOBODY for row in rows)


def test_other_peoples_follows_do_not_show_up_in_my_rows(
    client: TestClient, db: Session, auth_headers: Headers
) -> None:
    seed(db)
    _follow(client, db, auth_headers("Sam"), "Jordan")

    rows = client.get("/games", headers=auth_headers("Riley")).json()

    assert all(row["following_in_game"] == NOBODY for row in rows)


def test_unfollowing_takes_the_game_out_of_the_filter(
    client: TestClient, db: Session, auth_headers: Headers
) -> None:
    seed(db)
    riley = auth_headers("Riley")
    _follow(client, db, riley, "Jordan")
    client.delete(f"/users/{_id(db, 'Jordan')}/follow", headers=riley)

    assert client.get("/games", params={"following": "true"}, headers=riley).json() == []


def test_detail_says_which_followed_players_are_in_the_game(
    client: TestClient, db: Session, auth_headers: Headers
) -> None:
    seed(db)
    riley = auth_headers("Riley")
    _follow(client, db, riley, "Maya", "Alex")
    game_id = _game_id(db, 0)

    as_riley = client.get(f"/games/{game_id}", headers=riley).json()
    anonymous = client.get(f"/games/{game_id}").json()

    assert as_riley["following_in_game"] == {"count": 2, "names": ["Maya", "Alex"]}
    assert anonymous["following_in_game"] == NOBODY


def test_my_games_rows_carry_the_same_field(
    client: TestClient, db: Session, auth_headers: Headers
) -> None:
    seed(db)
    maya = auth_headers("Maya")
    _follow(client, db, maya, "Jordan")

    body = client.get("/me/games", headers=maya).json()

    assert _by_venue(body["joined"])["Bonsor Rec Centre"] == {"count": 1, "names": ["Jordan"]}
    assert _by_venue(body["hosting"])["BCIT Gym"] == {"count": 1, "names": ["Jordan"]}


def test_joining_a_game_returns_the_field_too(
    client: TestClient, db: Session, auth_headers: Headers
) -> None:
    seed(db)
    riley = auth_headers("Riley")
    _follow(client, db, riley, "Jordan")

    joined = client.post(f"/games/{_game_id(db, 1)}/join", headers=riley).json()

    assert joined["following_in_game"] == {"count": 1, "names": ["Jordan"]}
