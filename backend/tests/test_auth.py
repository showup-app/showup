from sqlalchemy import select

from app.models import User
from app.security import decode_access_token, hash_password, verify_password
from app.seed import DEMO_PASSWORD, seed


def test_signup_success(client, db):
    body = {"email": "New@Test.com", "password": "longenough1", "name": "New Person"}
    r = client.post("/auth/signup", json=body)
    assert r.status_code == 201
    data = r.json()
    assert data["email"] == "new@test.com"  # lowercased
    assert data["name"] == "New Person"
    assert "password" not in r.text
    assert "password_hash" not in r.text

    user = db.scalar(select(User).where(User.email == "new@test.com"))
    assert user is not None
    assert user.password_hash != "longenough1"
    assert verify_password("longenough1", user.password_hash)


def test_signup_duplicate_email(client):
    body = {"email": "dup@test.com", "password": "longenough1", "name": "Dup"}
    assert client.post("/auth/signup", json=body).status_code == 201
    assert client.post("/auth/signup", json=body).status_code == 409


def test_signup_duplicate_email_different_case(client):
    client.post(
        "/auth/signup", json={"email": "a@test.com", "password": "longenough1", "name": "A"}
    )
    r = client.post(
        "/auth/signup", json={"email": "A@Test.com", "password": "longenough1", "name": "A"}
    )
    assert r.status_code == 409


def test_signup_short_password(client):
    body = {"email": "short@test.com", "password": "short", "name": "Short"}
    assert client.post("/auth/signup", json=body).status_code == 422


def test_signup_invalid_email(client):
    body = {"email": "not-an-email", "password": "longenough1", "name": "Bad"}
    assert client.post("/auth/signup", json=body).status_code == 422


def test_signup_missing_name(client):
    body = {"email": "noname@test.com", "password": "longenough1"}
    assert client.post("/auth/signup", json=body).status_code == 422


def test_signup_blank_name(client):
    body = {"email": "blank@test.com", "password": "longenough1", "name": "   "}
    assert client.post("/auth/signup", json=body).status_code == 422


def test_signup_trims_name(client):
    body = {"email": "trim@test.com", "password": "longenough1", "name": "  Trim Me  "}
    assert client.post("/auth/signup", json=body).json()["name"] == "Trim Me"


def make_user(db, email="login@test.com", password="correct-horse"):
    user = User(email=email, name="Login Test", password_hash=hash_password(password))
    db.add(user)
    db.commit()
    return user


def test_login_returns_working_token(client, db):
    user = make_user(db)
    r = client.post("/auth/login", json={"email": "login@test.com", "password": "correct-horse"})
    assert r.status_code == 200
    assert r.json()["token_type"] == "bearer"
    assert decode_access_token(r.json()["access_token"]) == user.id


def test_login_wrong_password(client, db):
    make_user(db)
    r = client.post("/auth/login", json={"email": "login@test.com", "password": "nope"})
    assert r.status_code == 401
    assert r.headers["www-authenticate"] == "Bearer"


def test_login_unknown_email_same_error(client):
    r = client.post("/auth/login", json={"email": "ghost@test.com", "password": "whatever1"})
    assert r.status_code == 401
    assert r.json()["detail"] == "Invalid email or password"


def test_seeded_user_can_log_in(client, db):
    seed(db)
    r = client.post(
        "/auth/login",
        json={"email": "maya@seed.showup.local", "password": DEMO_PASSWORD},
    )
    assert r.status_code == 200


def test_login_strips_email(client, db):
    make_user(db)
    r = client.post("/auth/login", json={"email": " login@test.com ", "password": "correct-horse"})
    assert r.status_code == 200


def test_me_returns_the_signed_in_user(client, db):
    user = make_user(db)
    token = client.post(
        "/auth/login", json={"email": "login@test.com", "password": "correct-horse"}
    ).json()["access_token"]

    r = client.get("/auth/me", headers={"Authorization": f"Bearer {token}"})

    assert r.status_code == 200
    assert r.json() == {
        "id": user.id,
        "email": "login@test.com",
        "name": "Login Test",
        "reputation": 100,
        "games_played": 0,
        "games_hosted": 0,
        "is_new": True,
    }


def test_me_without_token_is_401(client):
    r = client.get("/auth/me")
    assert r.status_code == 401
    assert r.headers["www-authenticate"] == "Bearer"


def test_logout_with_valid_token(client, db):
    make_user(db)
    login = client.post(
        "/auth/login", json={"email": "login@test.com", "password": "correct-horse"}
    )
    token = login.json()["access_token"]
    r = client.post("/auth/logout", headers={"Authorization": f"Bearer {token}"})
    assert r.status_code == 204


def test_logout_without_token(client):
    r = client.post("/auth/logout")
    assert r.status_code == 401


def test_me_counts_played_and_hosted_games(client, db):
    from app.seed import DEMO_PASSWORD, seed

    seed(db)

    # Seed facts: Alex hosted the played game; Jordan showed up to it; Sam did not.
    def profile(name):
        token = client.post(
            "/auth/login", json={"email": f"{name}@seed.showup.local", "password": DEMO_PASSWORD}
        ).json()["access_token"]
        return client.get("/auth/me", headers={"Authorization": f"Bearer {token}"}).json()

    alex, jordan, sam = profile("alex"), profile("jordan"), profile("sam")

    assert (alex["games_played"], alex["games_hosted"], alex["is_new"]) == (0, 1, True)
    assert (jordan["games_played"], jordan["reputation"], jordan["is_new"]) == (1, 100, True)
    assert (sam["games_played"], sam["reputation"], sam["is_new"]) == (0, 75, True)
