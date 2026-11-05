# 0003: Following other players

Date: 2026-10-31. Status: proposed for the team to discuss; nothing built yet. Trello card [F19].

The "social" part of ShowUp is one thing: **you can follow players you have played with, and the app
uses that to show you where they are playing next.** No feed, no posts, no chat, no friend requests.
Reputation already gives hosts a reason to trust strangers; following gives players a reason to come
back to the same courts and the same people.

## What a user sees

| Where | What |
|---|---|
| Game detail, roster | Tap a player → their public profile. |
| Public profile (new screen) | Name, reputation or "New", games played, games hosted, followers and following counts, a **Follow / Following** button. Never the email. Your own profile shows the same numbers with Edit instead of Follow. |
| Explore | A filter chip **"People I follow"**: only games where someone you follow is hosting or has joined. Each card in that mode shows up to two names, e.g. "Jordan and Sam are in". |
| Game detail, header | "2 people you follow are in this game" when that is true. |
| Profile tab | Following and Followers counts, each opening a list of players with their reputation and a Follow button. |
| Sprint 3, with the reminders epic | Optional push or email: "Jordan posted a game at BCIT Gym on Thursday". |

## Decisions

1. **One-way follow, no approval.** Like Instagram, not Facebook. Following someone only means you see their
   games in a filter; it reveals nothing they have not already made public by joining a game, so nobody
   needs to accept. This removes a pending state, a requests inbox and two notification types. Alternative
   considered: mutual friends with a request flow. Rejected for sprint scope and because it adds friction
   to the thing we want people to do.
2. **Public profiles inside the app only.** Name, reputation, counts. Email, password hash and attendance
   history stay private. A player's roster membership is already visible on every game they join, so a
   profile shows nothing new.
3. **A follow is a table row, not a flag on users.** `follows(follower_id, followee_id, created_at)`,
   unique on the pair, check `follower_id <> followee_id`. Counts are computed, not cached, until a list
   shows them for many users at once; then they move to `users` the way `reputation` did.
4. **"People I follow" is a filter on the existing list, not a new endpoint.** `GET /games?following=true`
   keeps the Explore screen on one call and one type. Rows gain `following_in_game: list[str]` (up to two
   names, plus a count) so the card can say who.
5. **Blocking and reporting are not part of this.** A separate decision when the "fake events and dishonest
   hosts" feedback item is designed (sprint 3). Following someone who later blocks you is simply removed.
6. **No feed.** The timeline of "Jordan joined a game" is the games list itself, filtered. Building a feed
   means building ranking, pagination and read state for a four-person team in a three-week sprint.

## API (to build, backend)

| Method and path | Auth | Returns |
|---|---|---|
| `GET /users/{id}` | optional | `PublicProfileOut`: id, name, reputation, games_played, games_hosted, is_new, followers_count, following_count, `is_following` (false without a token) |
| `POST /users/{id}/follow` | Bearer | 201, the updated profile. 409 if already following, 422 if it is you. |
| `DELETE /users/{id}/follow` | Bearer | 200, the updated profile. 404 if not following. |
| `GET /me/following`, `GET /me/followers` | Bearer | lists of `PlayerOut` plus `is_following` |
| `GET /games?following=true` | Bearer | the usual rows, filtered; 401 without a token since "people I follow" needs a "me" |
| rows of `GET /games` and the detail | optional | new `following_in_game: {"count": n, "names": [...]}` (count 0 and empty list without a token) |

## Data

```
follows
  id           int PK
  follower_id  int FK users, index
  followee_id  int FK users, index
  created_at   timestamptz default now()
  unique (follower_id, followee_id)
  check (follower_id <> followee_id)
```

One Alembic migration. Deleting a user is still out of scope; when it arrives, follows cascade.

## Cards this produces

Backend (Nam Anh), about 3 h total:
- [F19] Migration for `follows` and `POST/DELETE /users/{id}/follow` with tests (60 min)
- [F19] `GET /users/{id}` public profile with counts and `is_following` (45 min)
- [F19] `GET /games?following=true` and `following_in_game` on rows and detail (60 min)
- [F19] `GET /me/following` and `GET /me/followers` (30 min)

Frontend, after the first two land:
- [F19] Public profile screen with Follow button, reached from the roster (90 min)
- [F19] "People I follow" chip on Explore and the "X and Y are in" line on cards (90 min)
- [F19] Following and Followers lists from the Profile tab (60 min)

## Open questions for the scrum

- Do we want the filter chip on Explore, or a separate "Friends" tab? Chip is cheaper and keeps one list.
- Should a host be able to see who among the roster follows whom? Proposed no; it adds nothing to hosting.
- Name: "Follow" or "Add to crew"? Follow is understood by everyone; crew is on-brand. Pick at scrum, it is one string.
