from sqlalchemy import select

from app.models import User
from app.security import verify_password


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
