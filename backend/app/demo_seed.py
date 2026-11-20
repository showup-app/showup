# ruff: noqa: E501  (the game table below is wider than 100 columns on purpose)
"""Demo data for presentations: one account that shows every screen state, plus a supporting cast.

Run from backend/:  uv run python -m app.demo_seed

Separate from app.seed on purpose: the tests pin exact facts about those five users. This cast
lives on its own email domain. Running it again deletes the demo accounts with their games,
signups and attendance, and recreates them, so it also resets whatever a rehearsal changed.
Real users and the app.seed users are never touched.

Game times are relative to the day it runs, in Vancouver local time. The nearest upcoming game is
three days out and the unmarked hosted game is one day back, so data seeded on a Sunday still reads
correctly on the Tuesday.

What the data is shaped around (the app as of sprint 3):
- Taylor, the main login, hosts and plays: an ended game waiting for attendance, upcoming hosted
  and joined games (one of each cancelled, one nearly full, one full), and a history whose marks
  read "no change", a no-show, and three recoveries.
- Addresses are exactly "street, City": the app shows the text after the last comma as the city.
- Durations are 60/90/120 and minimums 0/70/80, the choices the Edit screen can display.
- No upcoming game asks for more reputation than Taylor has, because a refused join is silent.
"""

import re
from dataclasses import dataclass
from datetime import date, datetime, time, timedelta
from decimal import Decimal
from zoneinfo import ZoneInfo

from sqlalchemy import delete, select
from sqlalchemy.orm import Session

from app.db import SessionLocal
from app.models import Attendance, Game, GameStatus, Signup, SignupStatus, User
from app.reputation import START, compute, recompute
from app.schemas.game import ALLOWED_SPORTS
from app.security import hash_password
from app.seed import DEMO_PASSWORD

DEMO_DOMAIN = "showup.demo"
VANCOUVER = ZoneInfo("America/Vancouver")

MAIN = "Taylor"  # the account to present with
SECOND = "Priya"  # a reliable regular on Taylor's roster, for the player's side of the story

# First names; the email is <name>@showup.demo. Everyone logs in with app.seed.DEMO_PASSWORD.
USERS: list[str] = [
    "Taylor",
    "Priya",
    "Marcus",
    "Elena",
    "Diego",
    "Leo",
    "Zoe",
    "Omar",
    "Hana",
    "Noah",
]

DURATIONS = (60, 90, 120)
MIN_REPUTATIONS = (0, 70, 80)
_ADDRESS = re.compile(r"^[^,]+, (Burnaby|Vancouver|Richmond)$")


@dataclass(frozen=True)
class DemoGame:
    key: str
    host: str
    sport: str
    venue: str
    address: str
    days: int  # from the day the seed runs; negative is the past
    at: str  # "18:30", Vancouver local time
    minutes: int
    spots: int  # players, not counting the host
    cost: str  # total venue cost; "0" is free
    min_rep: int
    players: tuple[str, ...]
    marks: dict[str, bool] | None = None  # the host's attendance marks; None means not marked
    cancelled: bool = False


G = DemoGame
T, F = True, False

# fmt: off
GAMES: list[DemoGame] = [
    # History, oldest first. Every player is marked, so these are "played" and move reputations.
    G("h1", "Zoe",    "basketball", "Bonsor Rec Centre",           "6550 Bonsor Ave, Burnaby",            -24, "18:00",  90,  8, "0",  0, ("Taylor", "Priya", "Marcus", "Elena", "Diego"), {"Taylor": T, "Priya": T, "Marcus": F, "Elena": T, "Diego": T}),
    G("h2", "Omar",   "soccer",     "Central Park Turf",           "3883 Imperial St, Burnaby",           -20, "10:00",  90, 12, "6",  0, ("Taylor", "Diego", "Leo", "Marcus", "Elena"),   {"Taylor": T, "Diego": T, "Leo": T, "Marcus": T, "Elena": T}),
    G("h3", "Zoe",    "volleyball", "Kitsilano Beach Courts",      "1499 Arbutus St, Vancouver",          -16, "17:30", 120, 10, "0",  0, ("Taylor", "Priya", "Elena", "Diego"),           {"Taylor": F, "Priya": T, "Elena": F, "Diego": T}),
    G("h4", "Priya",  "badminton",  "ClearOne Badminton",          "2368 No 5 Rd, Richmond",              -12, "19:00",  60,  4, "10", 0, ("Taylor", "Diego", "Leo", "Omar"),              {"Taylor": T, "Diego": T, "Leo": F, "Omar": T}),
    G("h5", "Omar",   "basketball", "Hillcrest Centre",            "4575 Clancy Loranger Way, Vancouver",  -9, "18:30",  90, 10, "0", 70, ("Taylor", "Priya", "Marcus", "Elena", "Diego"), {"Taylor": T, "Priya": T, "Marcus": F, "Elena": T, "Diego": F}),
    G("h6", "Elena",  "tennis",     "Queen Elizabeth Park Courts", "4600 Cambie St, Vancouver",            -6, "09:00",  60,  6, "0",  0, ("Taylor", "Priya", "Leo", "Hana", "Diego", "Omar"), {"Taylor": T, "Priya": T, "Leo": T, "Hana": T, "Diego": T, "Omar": T}),
    # Taylor as host. One played ("3/4 showed up"), one ended and waiting for attendance.
    G("t_played", "Taylor", "soccer",     "Burnaby Lake Fields", "3677 Kensington Ave, Burnaby", -4, "18:00", 90, 10, "5", 0, ("Elena", "Diego", "Zoe", "Marcus"), {"Elena": T, "Diego": T, "Zoe": T, "Marcus": F}),
    G("t_needs",  "Taylor", "basketball", "BCIT Gym",            "3700 Willingdon Ave, Burnaby", -1, "18:00", 90,  8, "0", 0, ("Priya", "Leo", "Hana", "Noah")),
    # Taylor's upcoming hosted games: roomy and free, nearly full with a minimum, cancelled.
    G("t_open",   "Taylor", "volleyball", "Trout Lake Community Centre", "3360 Victoria Dr, Vancouver",   3, "18:30",  90, 10, "0",  0, ("Priya", "Diego", "Hana")),
    G("t_nearly", "Taylor", "basketball", "Edmonds Community Centre",    "7433 Edmonds St, Burnaby",      5, "19:00", 120,  8, "8", 80, ("Priya", "Elena", "Diego", "Leo", "Zoe", "Omar")),
    G("t_cancel", "Taylor", "soccer",     "Confederation Park Field",    "250 Willingdon Ave, Burnaby",   6, "10:00",  90, 12, "0",  0, ("Leo", "Omar"), cancelled=True),
    # Games Taylor joined: one ended but never marked, then free, full and paid, cancelled, later.
    G("j_unmarked", "Elena", "tennis",     "Stanley Park Tennis Courts", "8901 Stanley Park Dr, Vancouver", -2, "17:00", 60,  4, "0",   0, ("Taylor", "Leo")),
    G("j_free",     "Omar",  "pickleball", "Richmond Olympic Oval",      "6111 River Rd, Richmond",          4, "17:00", 60,  8, "0",   0, ("Taylor", "Hana", "Leo")),
    G("j_full",     "Zoe",   "badminton",  "Stage 18 Badminton Centre",  "2351 No 6 Rd, Richmond",           6, "19:30", 60,  4, "10", 70, ("Taylor", "Priya", "Diego", "Elena")),
    G("j_cancel",   "Omar",  "hockey",     "Burnaby 8 Rinks",            "6501 Sprott St, Burnaby",          7, "20:00", 60, 12, "12",  0, ("Taylor", "Diego", "Leo"), cancelled=True),
    G("j_later",    "Priya", "ultimate",   "Jericho Beach Park",         "3941 Point Grey Rd, Vancouver",    9, "11:00", 90, 14, "0",   0, ("Taylor", "Zoe", "Hana", "Noah")),
    # Explore: upcoming games Taylor is not in. One nearly full, one full, free and paid.
    G("e_soccer",     "Priya", "soccer",     "Trillium Park",              "600 National Ave, Vancouver",   3, "10:00",  90, 14, "0",   0, ("Diego", "Leo", "Omar", "Hana", "Noah")),
    G("e_nearly",     "Omar",  "basketball", "Cameron Recreation Complex", "9523 Cameron St, Burnaby",      4, "18:00",  90,  9, "5",  70, ("Priya", "Elena", "Diego", "Leo", "Zoe", "Hana", "Noah")),
    G("e_full",       "Elena", "tennis",     "Kerrisdale Park Courts",     "5670 East Blvd, Vancouver",     5, "09:00",  60,  4, "0",   0, ("Priya", "Leo", "Zoe", "Omar")),
    G("e_hockey",     "Zoe",   "hockey",     "Minoru Arenas",              "7551 Minoru Gate, Richmond",    6, "21:00",  60, 12, "12", 80, ("Priya", "Diego", "Omar", "Leo")),
    G("e_ultimate",   "Diego", "ultimate",   "Minoru Park",                "7191 Granville Ave, Richmond",  7, "14:00", 120, 14, "0",   0, ("Elena", "Marcus", "Noah")),
    G("e_pickleball", "Leo",   "pickleball", "Central Park Courts",        "3883 Imperial St, Burnaby",     8, "16:00",  60,  8, "6",   0, ("Hana", "Marcus", "Zoe")),
    G("e_volleyball", "Priya", "volleyball", "Spanish Banks Beach",        "4801 NW Marine Dr, Vancouver", 10, "12:00", 120, 12, "0",   0, ("Omar", "Elena")),
]
# fmt: on


def _check() -> None:
    """Fail before touching the database if the table above is inconsistent."""
    keys = [g.key for g in GAMES]
    venues = [g.venue for g in GAMES if g.days > 0]
    if len(set(keys)) != len(keys) or len(set(venues)) != len(venues):
        raise ValueError("demo game keys and upcoming venues must be unique")
    for g in GAMES:
        people = (g.host, *g.players)
        problems = [
            (set(people) - set(USERS), "unknown user"),
            (len(set(people)) != len(people), "host listed as a player, or a player twice"),
            (len(g.players) > g.spots or not 2 <= g.spots <= 30, "more players than spots"),
            (g.sport not in ALLOWED_SPORTS, "sport the app does not know"),
            (g.minutes not in DURATIONS, "duration the Edit screen cannot show"),
            (g.min_rep not in MIN_REPUTATIONS, "minimum the Edit screen cannot show"),
            (not _ADDRESS.match(g.address), "address must be 'street, City'"),
            (g.days == 0, "a game today flips between upcoming and past during the demo"),
            (g.marks is not None and (g.days > 0 or g.cancelled), "marks on a game not played"),
            (g.marks is not None and set(g.marks) != set(g.players), "mark every player or none"),
        ]
        for bad, why in problems:
            if bad:
                raise ValueError(f"demo game {g.key}: {why}")


def _status(g: DemoGame) -> GameStatus:
    if g.cancelled:
        return GameStatus.CANCELLED
    if g.marks is not None:
        return GameStatus.PLAYED
    return GameStatus.FULL if len(g.players) == g.spots else GameStatus.OPEN


def seed_demo(db: Session, today: date | None = None) -> dict[str, int]:
    """Delete the previous demo rows, insert fresh ones, commit. Returns row counts.

    `today` is the day the game offsets count from; it defaults to today in Vancouver.
    """
    _check()
    old_ids = db.scalars(select(User.id).where(User.email.like(f"%@{DEMO_DOMAIN}"))).all()
    if old_ids:
        db.execute(delete(Attendance).where(Attendance.user_id.in_(old_ids)))
        db.execute(delete(Signup).where(Signup.user_id.in_(old_ids)))
        db.execute(delete(Game).where(Game.host_id.in_(old_ids)))  # cascades to their rows
        db.execute(delete(User).where(User.id.in_(old_ids)))

    demo_hash = hash_password(DEMO_PASSWORD)
    users = {
        name: User(email=f"{name.lower()}@{DEMO_DOMAIN}", password_hash=demo_hash, name=name)
        for name in USERS
    }
    db.add_all(users.values())
    db.flush()  # assigns ids so games can point at their hosts

    day = today or datetime.now(VANCOUVER).date()
    games = {
        g.key: Game(
            host_id=users[g.host].id,
            sport=g.sport,
            venue=g.venue,
            address=g.address,
            starts_at=datetime.combine(
                day + timedelta(days=g.days), time.fromisoformat(g.at), tzinfo=VANCOUVER
            ),
            duration_minutes=g.minutes,
            spots=g.spots,
            cost=Decimal(g.cost),
            min_reputation=g.min_rep,
            status=_status(g),
        )
        for g in GAMES
    }
    db.add_all(games.values())
    db.flush()

    signups = [
        Signup(game_id=games[g.key].id, user_id=users[name].id, status=SignupStatus.JOINED)
        for g in GAMES
        for name in g.players
    ]
    db.add_all(signups)

    # Replay the marks in date order, so each row holds the player's reputation just before and
    # just after that game. That difference is what the Profile screen shows per game.
    shows = dict.fromkeys(USERS, 0)
    marked = dict.fromkeys(USERS, 0)
    attendance = []
    for g in sorted((g for g in GAMES if g.marks is not None), key=lambda g: g.days):
        game = games[g.key]
        for name, showed_up in (g.marks or {}).items():
            before = compute(shows[name], marked[name]) if marked[name] else START
            shows[name] += showed_up
            marked[name] += 1
            attendance.append(
                Attendance(
                    game_id=game.id,
                    user_id=users[name].id,
                    showed_up=showed_up,
                    marked_by=game.host_id,
                    marked_at=game.starts_at + timedelta(minutes=g.minutes + 60),
                    reputation_before=before,
                    reputation_after=compute(shows[name], marked[name]),
                )
            )
    db.add_all(attendance)
    db.flush()

    for name, user in users.items():
        replayed = compute(shows[name], marked[name]) if marked[name] else START
        if recompute(db, user) != replayed:
            raise RuntimeError(
                f"{name}: stored reputation {user.reputation} != replayed {replayed}"
            )

    ceiling = users[MAIN].reputation
    blocked = [g.key for g in GAMES if g.days > 0 and g.host != MAIN and g.min_rep > ceiling]
    if blocked:
        raise RuntimeError(f"{MAIN} ({ceiling}) could not join: {', '.join(blocked)}")

    db.commit()
    return {
        "users": len(users),
        "games": len(games),
        "signups": len(signups),
        "attendance": len(attendance),
    }


def main() -> None:
    with SessionLocal() as db:
        counts = seed_demo(db)
    print(
        f"demo: {counts['users']} users, {counts['games']} games, "
        f"{counts['signups']} signups and {counts['attendance']} attendance marks"
    )
    print(
        f"log in as {MAIN.lower()}@{DEMO_DOMAIN} (has everything) or {SECOND.lower()}@{DEMO_DOMAIN}"
    )
    print("password: DEMO_PASSWORD in app/seed.py")


if __name__ == "__main__":
    main()
