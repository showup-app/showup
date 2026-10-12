from fastapi.testclient import TestClient
from sqlalchemy import func, select
from sqlalchemy.orm import Session

from app.models import Game, GameStatus, User
from app.seed import ATTENDANCE, GAMES, SIGNUPS, USERS, seed

UPCOMING = [g for g in GAMES if g[4] > 0 and g[9] != GameStatus.CANCELLED]
UPCOMING_BASKETBALL = [g for g in UPCOMING if g[1] == "basketball"]
NOT_CANCELLED = [g for g in GAMES if g[9] != GameStatus.CANCELLED]


def test_seed_creates_rows_and_is_rerunnable(db: Session) -> None:
    first = seed(db)
    second = seed(db)

    assert (
        first
        == second
        == {
            "users": len(USERS),
            "games": len(GAMES),
            "signups": len(SIGNUPS),
            "attendance": len(ATTENDANCE),
        }
    )
    assert db.scalar(select(func.count()).select_from(User)) == len(USERS)
    assert db.scalar(select(func.count()).select_from(Game)) == len(GAMES)


def test_list_games_returns_upcoming_sorted_by_start(client: TestClient, db: Session) -> None:
    seed(db)

    response = client.get("/games")

    assert response.status_code == 200
    body = response.json()
    assert len(body) == len(UPCOMING)
    starts = [g["starts_at"] for g in body]
    assert starts == sorted(starts)
    assert all(g["status"] != "cancelled" for g in body)


def test_list_games_filters_by_sport_case_insensitively(client: TestClient, db: Session) -> None:
    seed(db)

    response = client.get("/games", params={"sport": "Basketball"})

    assert response.status_code == 200
    body = response.json()
    assert len(body) == len(UPCOMING_BASKETBALL)
    assert {g["sport"] for g in body} == {"basketball"}


def test_list_games_unknown_sport_is_empty(client: TestClient, db: Session) -> None:
    seed(db)

    assert client.get("/games", params={"sport": "curling"}).json() == []


def test_list_games_can_include_past(client: TestClient, db: Session) -> None:
    seed(db)

    response = client.get("/games", params={"include_past": "true"})

    assert len(response.json()) == len(NOT_CANCELLED)


def test_game_shape(client: TestClient, db: Session) -> None:
    seed(db)

    game = client.get("/games").json()[0]

    assert set(game) == {
        "id",
        "host_id",
        "sport",
        "venue",
        "address",
        "starts_at",
        "duration_minutes",
        "spots",
        "cost",
        "min_reputation",
        "fallback_min_reputation",
        "fallback_hours_before_start",
        "status",
        "updated_at",
        "host_name",
        "host_reputation",
        "spots_left",
    }
    assert isinstance(game["cost"], int | float)


def test_list_games_host_and_spots_left_match_detail(client: TestClient, db: Session) -> None:
    seed(db)

    for row in client.get("/games", params={"include_past": "true"}).json():
        detail = client.get(f"/games/{row['id']}").json()

        assert row["host_name"] == detail["host_name"]
        assert row["host_reputation"] == detail["host_reputation"]
        assert row["spots_left"] == detail["spots_left"] == row["spots"] - len(detail["players"])


def test_list_games_full_game_has_zero_spots_left(client: TestClient, db: Session) -> None:
    seed(db)

    rows = client.get("/games", params={"include_past": "true"}).json()
    full = next(g for g in rows if g["venue"] == GAMES[5][2])

    assert full["spots"] == 4
    assert full["spots_left"] == 0
