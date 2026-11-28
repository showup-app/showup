# ShowUp backend

Python 3.13, FastAPI, Pydantic v2, SQLAlchemy 2, Alembic, Postgres. Package manager is uv.

| What | Where |
|---|---|
| Live API | https://showup-api-d572.onrender.com |
| Swagger UI (try every endpoint) | https://showup-api-d572.onrender.com/docs |
| Health check | https://showup-api-d572.onrender.com/health |

The live API is on a free plan: after 15 minutes without requests it sleeps, and the next request
takes about a minute.

## Setup

Needs [uv](https://docs.astral.sh/uv/getting-started/installation/) and Docker Desktop. uv installs
Python 3.13 itself.

1. From the repo root start Postgres: `docker compose up -d db`
2. In `backend/`: `cp .env.example .env` and set `JWT_SECRET`.
3. `uv sync` installs Python 3.13 and every dependency into `.venv`.
4. `uv run alembic upgrade head` creates the tables.
5. `uv run fastapi dev app/main.py` serves on http://localhost:8000 with reload.

Swagger UI: http://localhost:8000/docs. The React Native app reads the same contract from http://localhost:8000/openapi.json.

## Environment variables

Read by `app/config.py` from the environment, then from `backend/.env`. `.env.example` lists them
with comments. The app refuses to start if a required one is missing.

| Variable | Required | What it is |
|---|---|---|
| `DATABASE_URL` | yes | Postgres address with the `postgresql+psycopg://` prefix |
| `JWT_SECRET` | yes | Signs the access tokens. At least 32 characters |
| `JWT_EXPIRE_MINUTES` | no | Token lifetime. Default 10080 (7 days) |
| `CORS_ORIGINS` | no | JSON list of web origins allowed to call the API. Default `["http://localhost:8081"]` |
| `TEST_DATABASE_URL` | no | Only for `pytest`, when the test database is not on `localhost:5432` |
| `SUPABASE_DATABASE_URL` | no | Only for running a script against the hosted database |

## Try it

1. Load the demo data: `uv run python -m app.demo_seed`. It creates 10 players and 23 games whose
   dates are relative to today, and it is safe to run again.
2. Open http://localhost:8000/docs and call `POST /auth/login` with `taylor@showup.demo`. Every demo
   account uses the password in `DEMO_PASSWORD` in `app/seed.py`. The response has `access_token`.
3. Click **Authorize** in Swagger UI and paste the token. Outside Swagger, send it as
   `Authorization: Bearer <token>`.
4. Check the main flow:

| Call | Expected |
|---|---|
| `GET /auth/me` | Taylor, reputation 89 |
| `GET /me/games?include_past=true` | Games in both `hosting` and `joined`, one of each cancelled |
| `GET /games` | Upcoming games by other hosts, soonest first |
| `POST /games/{id}/join` on an open game | 201, and the game now shows `joined: true` |
| `DELETE /games/{id}/join` on the same game | 200, the spot is free again |
| `POST /games/{id}/attendance` on the game Taylor hosted yesterday | 200, and each marked player's reputation is recomputed |

## Everyday commands

| Task | Command |
|---|---|
| Run tests | `uv run pytest` |
| Lint and format | `uv run ruff check . && uv run ruff format .` |
| Type check | `uv run mypy` |
| New migration after changing models | `uv run alembic revision --autogenerate -m "add users table"` |
| Apply migrations | `uv run alembic upgrade head` |
| Load demo users and games (safe to repeat) | `uv run python -m app.seed` |
| Load the presentation cast: one account with every screen state (safe to repeat, resets a rehearsal) | `uv run python -m app.demo_seed` |
| Build the deploy image | `docker build -t showup-api .` |

## Endpoints

Swagger UI is the full reference with every field. "Optional" means the endpoint works without a
token and returns more when one is sent.

| Method and path | Auth | What it does |
|---|---|---|
| `GET /health` | none | 200 only if the API is up and the database answers |
| `POST /auth/signup` | none | Create an account. Returns the user and a token |
| `POST /auth/login` | none | Returns a token |
| `GET /auth/me` | Bearer | The signed-in user with reputation, games played and hosted |
| `POST /auth/logout` | Bearer | 204. The app drops the token |
| `GET /games` | optional | Upcoming games. Filters: `sport`, `location`, `include_past`, `following` |
| `POST /games` | Bearer | Post a game. The caller becomes the host |
| `GET /games/{id}` | optional | One game with its host and roster |
| `PATCH /games/{id}` | Bearer, host | Change a game's details |
| `POST /games/{id}/cancel` | Bearer, host | Cancel a game |
| `POST /games/{id}/join` | Bearer | Take a spot |
| `DELETE /games/{id}/join` | Bearer | Give up your spot |
| `DELETE /games/{id}/players/{user_id}` | Bearer, host | Remove a player from the roster |
| `POST /games/{id}/attendance` | Bearer, host | Record who showed up |
| `GET /me/games` | Bearer | The games you host and the games you joined |
| `GET /me/following` | Bearer | The players you follow |
| `GET /me/followers` | Bearer | The players who follow you |
| `GET /users/{id}` | optional | A player's public profile |
| `POST /users/{id}/follow` | Bearer | Follow a player |
| `DELETE /users/{id}/follow` | Bearer | Stop following a player |

## Tests

`uv run pytest` runs everything: 162 tests in 18 files. They use the `showup_test` database so
they never touch dev data. Postgres creates it from `docker/initdb/01-test-db.sql` the first time
the volume is created. If your Postgres is not on `localhost:5432`, set `TEST_DATABASE_URL`.

**Functional tests** are almost all of the suite. Each one calls the real API through FastAPI's
`TestClient` against a real Postgres, with the tables emptied between tests. They cover the success
path and the failure paths (401, 403, 404, 409, 422).

| Area | Files in `tests/` |
|---|---|
| Sign up, log in, tokens | `test_auth.py` |
| Posting, listing, filtering and reading games | `test_games.py`, `test_game_detail.py`, `test_location_filter.py`, `test_my_games.py`, `test_cost_split.py` |
| Joining, leaving, host actions | `test_join_leave.py`, `test_host_endpoints.py`, `test_remove_player.py` |
| Attendance and reputation | `test_attendance.py`, `test_reputation.py` |
| Following | `test_follows.py`, `test_public_profile.py`, `test_following_filter.py`, `test_follow_lists.py` |
| Demo data, health, security headers | `test_demo_seed.py`, `test_health.py`, `test_security_headers.py` |

**Unit tests** call one function directly, with no HTTP request and no query. There are two, both in
`tests/test_reputation.py`: the reputation formula and the fallback-minimum time window.

```bash
uv run pytest tests/test_reputation.py -k "formula or fallback_applies"
```

They share the suite's database fixture, so Postgres still has to be running.

## CI/CD

The pipeline has three stages. Nothing reaches `main` without the first two, and every commit on
`main` is deployed.

| Stage | What runs automatically | When |
|---|---|---|
| Build | `uv sync --locked` installs the exact locked dependencies; it fails if `uv.lock` is out of date | Every pull request and every push to `main` |
| Test | Lint, format check, type check (mypy), all migrations on an empty Postgres 17, a check that models and migrations agree, then the tests | Same run, `.github/workflows/backend.yml` |
| Deploy | Render builds the Docker image from `backend/Dockerfile` and starts it. On start the container runs `alembic upgrade head`, then the API | Every commit on `main` |

- `main` is protected: a change needs a pull request, one approval and a green `lint, migrate,
  test` check, and it is squash-merged. So the commit Render deploys has always passed the tests.
- The deploy settings are in `render.yaml` at the repo root: Docker runtime, root directory
  `backend`, health check `/health`.
- Why it helps: every pull request gets the same checks in about a minute, the schema can never be
  behind the code because migrations run on start, and nobody deploys by hand.
- Manual parts: the three secrets (`DATABASE_URL`, `JWT_SECRET`, `CORS_ORIGINS`) are typed once into
  the Render dashboard. The deploy is started by Render watching `main`, not by a GitHub Actions
  job, so the deploy log is in the Render dashboard and not in the Actions tab.

Run the same checks locally before you push:

```bash
uv run ruff check . && uv run ruff format --check . && uv run mypy && uv run alembic check && uv run pytest
```

## Folder map

```
app/
  main.py        FastAPI app, CORS, security headers, router registration
  config.py      Settings read from .env (fails fast if a secret is missing)
  db.py          engine, SessionLocal, Base, get_db dependency
  deps.py        DbDep, CurrentUser and OptionalUser dependencies
  security.py    password hashing, creating and reading access tokens
  reputation.py  every reputation rule and constant
  models/        SQLAlchemy tables, one module per table, imported in __init__.py
  schemas/       Pydantic request and response bodies, one module per feature
  routers/       endpoints, one module per feature
  seed.py        small demo data set that the tests pin
  demo_seed.py   the presentation cast
alembic/         migrations (versions/ holds the history)
tests/           pytest, fixtures in conftest.py
Dockerfile       the image Render runs
```

## Auth contract

- `POST /auth/signup` creates a user, `POST /auth/login` returns the token, `GET /auth/me` returns the signed-in user, `POST /auth/logout` is a stateless 204 (the app drops the token; it stays valid until it expires).
- Protected endpoints read `Authorization: Bearer <token>` through `CurrentUser` in `app/deps.py`.
- A token is a JWT signed with `JWT_SECRET` (HS256) whose `sub` is the user id as a string. `app/security.py` has `create_access_token(user_id)` and `decode_access_token(token)`; the login endpoint should call the first, nothing else needs to touch JWTs.
- Missing or bad token: 401 with `WWW-Authenticate: Bearer`. Wrong user for the action (not the host): 403.
- Host-only game actions: `PATCH /games/{id}`, `POST /games/{id}/cancel`, `DELETE /games/{id}/players/{user_id}` (marks the signup `removed`; the player cannot rejoin), `POST /games/{id}/attendance`.

## Security

- Passwords are stored as Argon2 hashes (`pwdlib`), never as text. A login with an unknown email
  still verifies a dummy hash, so the response time does not reveal which emails are registered.
- Every request body is validated by a Pydantic schema before any code runs; a bad body is a 422.
- All queries go through SQLAlchemy with bound parameters. No SQL is built from request text.
- The public profile and the rosters never include an email.
- CORS allows only the origins in `CORS_ORIGINS`.
- Every response carries `X-Content-Type-Options: nosniff`, `X-Frame-Options: DENY` and
  `Referrer-Policy: no-referrer` (middleware in `app/main.py`).
- Secrets live in `.env` locally and in the Render dashboard when deployed. Neither is in the repo.

## Reputation

All rules and constants are in `app/reputation.py`; the reasoning is in
`docs/decisions/0002-reputation.md`. Short version: everyone starts at 100 and shows as "New"
until three games; the score is a show-up rate with a three-game cushion, recomputed from
`attendance` when a host marks (`POST /games/{id}/attendance`, host only, after kickoff, within 7
days); hosts set any minimum up to 100 and may set a one-step fallback
that applies N hours before kickoff.

## Following

The design and the reasons are in `docs/decisions/0003-following.md`. A follow is one-way and
needs no approval.

| Method and path | Auth | Result |
|---|---|---|
| `POST /users/{id}/follow` | Bearer | 201 with the followed player's public profile. 409 if you already follow them, 422 if it is you, 404 for an unknown user |
| `DELETE /users/{id}/follow` | Bearer | 200 with the profile. 404 if you do not follow them |
| `GET /users/{id}` | optional | The public profile. `is_following` is false without a token |
| `GET /games?following=true` | Bearer | Only games where a player you follow hosts or has joined. 401 without a token |
| `GET /me/following` | Bearer | The players you follow, most recently followed first |
| `GET /me/followers` | Bearer | The players who follow you, newest first. `is_following` shows who you follow back |

- The public profile (`PublicProfileOut` in `app/schemas/user.py`) has id, name, reputation,
  games_played, games_hosted, is_new, followers_count, following_count and is_following. It never
  has the email.
- The two lists return `FollowedPlayerOut` rows: id, name, reputation, games_played, is_new and
  is_following.
- Every game row and the game detail carry `following_in_game: {"count": n, "names": [...]}`:
  the players you follow who host or have joined that game, up to two names (host first, then
  oldest signup first). Count 0 and no names without a token.

## Known limitations

- Logout is client-side only. A token stays valid until it expires (7 days by default).
- A player cannot yet dispute a no-show. The `attendance` table has the columns for it
  (`disputed_at`, `dispute_note`), but there is no endpoint.
- There is no waitlist. The `waitlist` signup status exists, but joining a full game is refused.
- The API sends no email (no join confirmation, no reminder).
- A 500 from an unhandled error does not carry the three security headers.
- Local development uses Postgres 18 (`compose.yaml`); CI and the hosted database use Postgres 17.
- The live API sleeps when idle (free plan), so the first request can take about a minute.

## Conventions

- Routes are plain `def`, not `async def`. SQLAlchemy calls are blocking and FastAPI runs sync routes in a thread pool, so this is both simpler and correct.
- One router, one schema module and one model module per feature. Register the router in `app/main.py`.
- Never edit the database by hand. Change the model, autogenerate a migration, review it, commit it.
- Secrets live in `.env`, which is git-ignored. Add every new variable to `.env.example` with a comment.
