# ShowUp backend

Python 3.13, FastAPI, Pydantic, SQLAlchemy 2, Alembic, Postgres. Package manager is uv.

## Setup

1. Install [uv](https://docs.astral.sh/uv/getting-started/installation/) and Docker Desktop.
2. From the repo root start Postgres: `docker compose up -d db`
3. In `backend/`: `cp .env.example .env` and set `JWT_SECRET`.
4. `uv sync` installs Python 3.13 and every dependency into `.venv`.
5. `uv run alembic upgrade head` creates the tables.
6. `uv run fastapi dev app/main.py` serves on http://localhost:8000 with reload.

Swagger UI: http://localhost:8000/docs. The React Native app reads the same contract from http://localhost:8000/openapi.json.

## Everyday commands

| Task | Command |
|---|---|
| Run tests | `uv run pytest` |
| Lint and format | `uv run ruff check . && uv run ruff format .` |
| New migration after changing models | `uv run alembic revision --autogenerate -m "add users table"` |
| Apply migrations | `uv run alembic upgrade head` |
| Load demo users and games (safe to repeat) | `uv run python -m app.seed` |
| Build the deploy image | `docker build -t showup-api .` |

Tests use the `showup_test` database so they never touch dev data. Postgres creates it from `docker/initdb/01-test-db.sql` the first time the volume is created.

## CI

Every pull request runs `.github/workflows/backend.yml`: lint, format check, all migrations on an empty Postgres 17, a check that models and migrations agree, then the tests. Run the same thing locally before you push:

```bash
uv run ruff check . && uv run ruff format --check . && uv run alembic check && uv run pytest
```

## Folder map

```
app/
  main.py        FastAPI app, middleware, router registration
  config.py      Settings read from .env (fails fast if a secret is missing)
  db.py          engine, SessionLocal, Base, get_db dependency
  models/        SQLAlchemy tables, one module per table, imported in __init__.py
  schemas/       Pydantic request and response bodies, one module per feature
  routers/       endpoints, one module per feature
alembic/         migrations (versions/ holds the history)
tests/           pytest, TestClient fixture in conftest.py
```

## Auth contract

- `POST /auth/signup` creates a user, `POST /auth/login` returns the token, `GET /auth/me` returns the signed-in user, `POST /auth/logout` is a stateless 204 (the app drops the token; it stays valid until it expires).
- Protected endpoints read `Authorization: Bearer <token>` through `CurrentUser` in `app/deps.py`.
- A token is a JWT signed with `JWT_SECRET` (HS256) whose `sub` is the user id as a string. `app/security.py` has `create_access_token(user_id)` and `decode_access_token(token)`; the login endpoint should call the first, nothing else needs to touch JWTs.
- Missing or bad token: 401 with `WWW-Authenticate: Bearer`. Wrong user for the action (not the host): 403.

## Reputation

All rules and constants are in `app/reputation.py`; the reasoning is in
`docs/decisions/0002-reputation.md`. Short version: everyone starts at 100 and shows as "New"
until three games; the score is a show-up rate with a three-game cushion, recomputed from
`attendance` when a host marks; hosts set any minimum up to 100 and may set a one-step fallback
that applies N hours before kickoff.

## Conventions

- Routes are plain `def`, not `async def`. SQLAlchemy calls are blocking and FastAPI runs sync routes in a thread pool, so this is both simpler and correct.
- One router, one schema module and one model module per feature. Register the router in `app/main.py`.
- Never edit the database by hand. Change the model, autogenerate a migration, review it, commit it.
- Secrets live in `.env`, which is git-ignored. Add every new variable to `.env.example` with a comment.
