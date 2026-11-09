from datetime import UTC, datetime, timedelta
from decimal import Decimal

from app.models import Game, Signup, SignupStatus, User


def make_user(db, email):
    user = User(email=email, name=email.split("@")[0], password_hash="x")
    db.add(user)
    db.flush()
    return user


def make_game(db, spots=10, cost="55.00"):
    host = make_user(db, "host@test.com")
    game = Game(
        host_id=host.id,
        sport="soccer",
        venue="Test Field",
        address="1 Test St",
        starts_at=datetime.now(UTC) + timedelta(days=2),
        spots=spots,
        cost=Decimal(cost),
    )
    db.add(game)
    db.commit()
    return game


def test_detail_has_cost_per_player(client, db):
    game = make_game(db)  # 55.00 / (10+1)
    r = client.get(f"/games/{game.id}")
    assert r.status_code == 200
    assert r.json()["cost"] == 55.0
    assert r.json()["cost_per_player"] == 5.0


def test_list_has_cost_per_player(client, db):
    make_game(db)
    r = client.get("/games")
    assert r.json()[0]["cost_per_player"] == 5.0


def test_cost_per_player_rounds_to_the_cent(client, db):
    game = make_game(db, spots=2, cost="10.00")  # 10/3
    assert client.get(f"/games/{game.id}").json()["cost_per_player"] == 3.33


def test_free_game(client, db):
    game = make_game(db, cost="0")
    assert client.get(f"/games/{game.id}").json()["cost_per_player"] == 0.0


def test_cost_per_player_does_not_change_when_someone_joins(client, db):
    game = make_game(db)
    before = client.get(f"/games/{game.id}").json()["cost_per_player"]
    player = make_user(db, "player@test.com")
    db.add(Signup(game_id=game.id, user_id=player.id, status=SignupStatus.JOINED))
    db.commit()
    after = client.get(f"/games/{game.id}").json()["cost_per_player"]
    assert before == after == 5.0
