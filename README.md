# ShowUp

Drop-in sports games with a show-up reputation. Hosts post a game, players join, attendance builds trust.

COMP 7082 Software Engineering, BCIT, Fall 2026. Group 15.

## Layout

| Folder | What | Stack |
|---|---|---|
| `backend/` | REST API | Python 3.13, FastAPI, SQLAlchemy 2, Alembic, Postgres |
| `frontend/` | Mobile app | React Native (Expo), TypeScript |
| `landing/` | Landing page | React, Vite, TypeScript |
| `docs/` | ERD and decision records | Markdown |
| `docker/` | Local Postgres init scripts | SQL |
| `.github/workflows/` | CI for the backend and the frontend | GitHub Actions |

## Live

| What | Where |
|---|---|
| API | https://showup-api-d572.onrender.com |
| API docs (Swagger UI) | https://showup-api-d572.onrender.com/docs |

The API is on a free plan and sleeps after 15 idle minutes, so the first request can take about a
minute.

## Quick start (backend)

Needs [uv](https://docs.astral.sh/uv/) and Docker Desktop.

```bash
docker compose up -d db
cd backend
cp .env.example .env
uv sync
uv run alembic upgrade head
uv run fastapi dev app/main.py
```

API docs: http://localhost:8000/docs. Health: http://localhost:8000/health.

Full backend guide, with the environment variables, the endpoints, a flow to try and the known
limitations: [backend/README.md](backend/README.md).

## Quick start (frontend)

Needs Node.js and the backend running (or the live API).

```bash
cd frontend
npm install
cp .env.example .env
npx expo start
```

Full frontend guide: [frontend/README.md](frontend/README.md).

## Tests

| Part | Command | What it runs |
|---|---|---|
| Backend | `cd backend && uv run pytest` | 162 tests: API tests against a real Postgres, plus unit tests of the reputation rules |
| Frontend | `cd frontend && npm test` | 59 tests in 12 files for the screens and the game and player cards, with a coverage report |

Details: [backend/README.md](backend/README.md#tests).

## CI/CD

| Stage | Backend | Frontend |
|---|---|---|
| Build | `uv sync --locked` | `npm ci` |
| Test | ruff, mypy, migrations on an empty Postgres, pytest | ESLint, Prettier, `tsc`, Jest |
| Deploy | Render builds the Docker image and deploys every commit on `main` | no deploy step in this repo |

- Both workflows run on every pull request and on every push to `main`
  ([backend.yml](.github/workflows/backend.yml), [frontend.yml](.github/workflows/frontend.yml)).
- `main` is protected: a change needs a pull request, one approval and a green backend check, and
  it is squash-merged.
- More in [backend/README.md](backend/README.md#cicd).

## Decisions

- [docs/decisions/0001-backend-stack.md](docs/decisions/0001-backend-stack.md)
- [docs/decisions/0002-reputation.md](docs/decisions/0002-reputation.md)
- [docs/decisions/0003-following.md](docs/decisions/0003-following.md)
- Data model: [docs/erd.md](docs/erd.md)

## Board

Trello: https://trello.com/b/0RpZh6q1/showup
