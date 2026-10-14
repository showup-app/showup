# ruff: noqa: E501  (the tables below are wider than 100 columns on purpose)
"""Seed the database with demo users, games, signups and attendance.

Run from backend/:  uv run python -m app.seed

Safe to run again: seed users are recognised by their email domain, and their games,
signups, attendance and accounts are deleted and recreated each time. Real users are never touched.
"""

from datetime import UTC, datetime, timedelta
from decimal import Decimal

from sqlalchemy import delete, select
from sqlalchemy.orm import Session

from app.db import SessionLocal
from app.models import Attendance, Game, GameStatus, Signup, SignupStatus, User
from app.reputation import recompute
from app.security import hash_password

SEED_DOMAIN = "seed.showup.local"

# Every seed user logs in with this. Fine to know: the accounts are on a fake domain.
DEMO_PASSWORD = "showup-demo"

# First names. Everyone starts at reputation 100; the attendance rows below move it.
USERS: list[str] = ["Maya", "Jordan", "Sam", "Riley", "Alex"]

# fmt: off
# (host index into USERS, sport, venue, address, days from now, hour, spots, cost, min rep, status)
GAMES: list[tuple[int, str, str, str, int, int, int, str, int, GameStatus]] = [
    (0, "basketball", "BCIT Gym",               "3700 Willingdon Ave, Burnaby",         1, 18, 10, "5.00", 80, GameStatus.OPEN),
    (1, "basketball", "Bonsor Rec Centre",      "6550 Bonsor Ave, Burnaby",             3, 19,  8, "0",     0, GameStatus.OPEN),
    (2, "soccer",     "Central Park Turf",      "3883 Imperial St, Burnaby",            2, 17, 14, "3.00",  0, GameStatus.OPEN),
    (4, "soccer",     "Trillium Park",          "1 Trillium Ln, Vancouver",             5, 10, 12, "0",    50, GameStatus.OPEN),
    (3, "volleyball", "Kitsilano Beach Courts", "1499 Arbutus St, Vancouver",           4, 20, 12, "4.00",  0, GameStatus.OPEN),
    (0, "badminton",  "ClearOne Badminton",     "2368 No 5 Rd, Richmond",               6,  9,  4, "8.00", 70, GameStatus.OPEN),
    (4, "basketball", "Hillcrest Centre",       "4575 Clancy Loranger Way, Vancouver", -2, 18, 10, "0",     0, GameStatus.PLAYED),
    (1, "soccer",     "Burnaby Lake Fields",    "3677 Kensington Ave, Burnaby",         7, 11, 10, "0",     0, GameStatus.CANCELLED),
]

# (game index into GAMES, user index into USERS, status). Hosts never sign up for their own game.
SIGNUPS: list[tuple[int, int, SignupStatus]] = [
    (0, 1, SignupStatus.JOINED),
    (0, 2, SignupStatus.JOINED),
    (0, 4, SignupStatus.JOINED),
    (1, 0, SignupStatus.JOINED),
    (2, 0, SignupStatus.JOINED),
    (2, 3, SignupStatus.REMOVED),
    (5, 1, SignupStatus.JOINED),   # badminton has 4 spots ...
    (5, 2, SignupStatus.JOINED),
    (5, 3, SignupStatus.JOINED),
    (5, 4, SignupStatus.JOINED),   # ... and is now full
    (6, 1, SignupStatus.JOINED),
    (6, 2, SignupStatus.JOINED),
]

# (game index, user index, showed up). Only the played game has marks; its host (Alex) marked them.
ATTENDANCE: list[tuple[int, int, bool]] = [
    (6, 1, True),    # Jordan showed up  -> stays at 100
    (6, 2, False),   # Sam did not       -> 75, so Sam cannot join the 80+ game at BCIT Gym
]
# fmt: on


def seed(db: Session) -> dict[str, int]:
    """Delete previous seed rows, insert fresh ones, commit. Returns row counts."""
    old_ids = db.scalars(select(User.id).where(User.email.like(f"%@{SEED_DOMAIN}"))).all()
    if old_ids:
        db.execute(delete(Attendance).where(Attendance.user_id.in_(old_ids)))
        db.execute(delete(Signup).where(Signup.user_id.in_(old_ids)))
        db.execute(delete(Game).where(Game.host_id.in_(old_ids)))  # cascades to their rows
        db.execute(delete(User).where(User.id.in_(old_ids)))

    demo_hash = hash_password(DEMO_PASSWORD)
    users = [
        User(email=f"{name.lower()}@{SEED_DOMAIN}", password_hash=demo_hash, name=name)
        for name in USERS
    ]
    db.add_all(users)
    db.flush()  # assigns ids so games can point at their hosts

    now = datetime.now(UTC)
    games = [
        Game(
            host_id=users[host].id,
            sport=sport,
            venue=venue,
            address=address,
            starts_at=(now + timedelta(days=days)).replace(
                hour=hour, minute=0, second=0, microsecond=0
            ),
            spots=spots,
            cost=Decimal(cost),
            min_reputation=min_rep,
            status=status,
        )
        for host, sport, venue, address, days, hour, spots, cost, min_rep, status in GAMES
    ]
    db.add_all(games)
    db.flush()

    signups = [
        Signup(game_id=games[game].id, user_id=users[user].id, status=status)
        for game, user, status in SIGNUPS
    ]
    db.add_all(signups)

    attendance = [
        Attendance(
            game_id=games[game].id,
            user_id=users[user].id,
            showed_up=showed_up,
            marked_by=games[game].host_id,
        )
        for game, user, showed_up in ATTENDANCE
    ]
    db.add_all(attendance)
    db.flush()

    for user in users:
        recompute(db, user)
    db.commit()
    return {
        "users": len(users),
        "games": len(games),
        "signups": len(signups),
        "attendance": len(attendance),
    }


def main() -> None:
    with SessionLocal() as db:
        counts = seed(db)
    print(
        f"seeded {counts['users']} users, {counts['games']} games, "
        f"{counts['signups']} signups and {counts['attendance']} attendance marks"
    )


if __name__ == "__main__":
    main()
