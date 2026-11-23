# ShowUp data model

Status: matches the models in `backend/app/models/` and the migrations in `backend/alembic/versions/`
as of 2026-11-22. First drafted 2026-10-01 for the ERD review. When a model changes, update this file
in the same pull request.

```mermaid
erDiagram
    users ||--o{ games : hosts
    users ||--o{ signups : joins
    games ||--o{ signups : has
    games ||--o{ attendance : records
    users ||--o{ attendance : "is marked in"
    users ||--o{ follows : follows
    users ||--o{ follows : "is followed in"

    users {
        int id PK
        string email UK
        string password_hash
        string name
        int reputation "show-up rate 0..100, starts at 100"
        datetime created_at
    }

    games {
        int id PK
        int host_id FK
        string sport "basketball, soccer, volleyball, badminton, ..."
        string venue
        string address
        datetime starts_at
        int duration_minutes "15..480, default 90"
        int spots "2..30, not counting the host"
        decimal cost "total venue cost, 0 = free"
        int min_reputation "0 = anyone"
        int fallback_min_reputation "optional lower minimum"
        int fallback_hours_before_start "when the lower minimum starts"
        string status "open, full, cancelled, played"
        datetime created_at
        datetime updated_at
    }

    signups {
        int id PK
        int game_id FK
        int user_id FK
        string status "joined, waitlist, removed"
        datetime created_at
    }

    attendance {
        int id PK
        int game_id FK
        int user_id FK
        bool showed_up
        int marked_by FK "host user id"
        datetime marked_at
        int reputation_before "score before this game was marked"
        int reputation_after "score after the latest mark"
        datetime disputed_at "null = never disputed"
        string dispute_note
    }

    follows {
        int id PK
        int follower_id FK "the user who follows"
        int followee_id FK "the user being followed"
        datetime created_at
    }
```

## Rules the tables enforce

- `signups` has a unique constraint on `(game_id, user_id)`: one row per player per game.
- `attendance` has the same unique pair. A row exists only after the host marks the game.
- `follows` is unique on `(follower_id, followee_id)` and has a check that the two are different,
  so nobody follows the same player twice or follows themselves. Both foreign keys cascade on
  delete: a follow disappears with either user.
- `games.host_id` points at `users`. Deleting a real user is still out of scope; only the seed
  scripts delete their own users.
- Deleting a game cascades to its `signups` and `attendance`.
- A game is **full** when the count of `signups` with status `joined` equals `spots`. The join endpoint
  checks this; the `status` column is a cache the host endpoints keep in sync.

## Decided since the first draft

| Question from the review | Decision |
|---|---|
| `venue`: free text or a `venues` table? | Free text. A table is a one-migration change if we need it |
| `reputation`: stored or computed each time? | Stored on `users`, recomputed from `attendance` whenever a host marks a game. Rules in `docs/decisions/0002-reputation.md` |
| Follower counts: stored or computed? | Computed on read for now. Reasons in `docs/decisions/0003-following.md` |
| `cost`: per player or total? | Total venue cost. The API returns the per-player share as `cost_per_player` |

## Still open

- Waitlist: the `waitlist` status exists on `signups`, but no endpoint writes it yet. Proposed: leaving a
  full game promotes the first `waitlist` row automatically, inside the leave endpoint.
- Disputes: `attendance.disputed_at` and `dispute_note` exist, but the dispute endpoint is not built yet.
