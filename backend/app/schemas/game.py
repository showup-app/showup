from datetime import UTC, datetime
from decimal import Decimal

from pydantic import BaseModel, ConfigDict, Field, field_validator

from app.models import GameStatus
from app.reputation import MAX_MIN_REPUTATION

# The sport picker on the Create Post screen. Lowercase, matched case-insensitively.
ALLOWED_SPORTS = (
    "basketball",
    "soccer",
    "volleyball",
    "badminton",
    "tennis",
    "pickleball",
    "ultimate",
    "hockey",
)


class GameOut(BaseModel):
    """A game row. What POST, PATCH and cancel return."""

    # Lets FastAPI build this straight from a Game ORM object.
    model_config = ConfigDict(from_attributes=True)

    id: int
    host_id: int
    sport: str
    venue: str
    address: str
    starts_at: datetime
    duration_minutes: int
    spots: int
    # Sent as a number (5.0), not a string, so the app can show it without parsing.
    cost: float
    min_reputation: int
    fallback_min_reputation: int | None
    fallback_hours_before_start: int | None
    status: GameStatus = Field(
        description="open = taking players, full = no spots left, cancelled = hidden from lists, "
        "played = kickoff passed and the host has marked attendance"
    )
    updated_at: datetime


class PlayerOut(BaseModel):
    """A player on a game's roster. Only what the Game Details screen shows."""

    id: int
    name: str
    reputation: int
    # Games this player was marked present at. With is_new, it tells a host how much to
    # trust the reputation number.
    games_played: int = Field(description="Games this player was marked present at")
    # True until the player has enough marked or hosted games; the app then shows "New"
    # instead of the score.
    is_new: bool = Field(
        description="True until 3 marked or hosted games; the app shows 'New' instead of the score"
    )
    showed_up: bool | None = Field(
        default=None,
        description="The host's mark: true showed up, false no-show, null not marked yet",
    )


class GameSummaryOut(GameOut):
    """A game as the Explore list shows it: the row plus its host and the places left.

    `spots` is the number of player places the host offers, not counting the host.
    `spots_left` is `spots` minus the players who have joined.
    """

    host_name: str
    host_reputation: int
    spots_left: int = Field(description="spots minus the players who have joined")


class GameDetailOut(GameSummaryOut):
    """A single game with its roster and the reputation requirement that applies right now."""

    players: list[PlayerOut] = Field(description="Players who have joined, oldest signup first")
    effective_min_reputation: int = Field(
        description="The requirement that applies right now: min_reputation, or the fallback "
        "once its window has started"
    )


class MyGamesOut(BaseModel):
    """GET /me/games. Two lists so the My Games screen maps straight to its tabs."""

    hosting: list[GameSummaryOut] = Field(description="Games I host, soonest first")
    joined: list[GameSummaryOut] = Field(description="Games I have a spot in, soonest first")


class AttendanceMark(BaseModel):
    user_id: int
    showed_up: bool


class AttendanceIn(BaseModel):
    """Body of POST /games/{id}/attendance. Players left out keep whatever mark they had."""

    model_config = ConfigDict(
        extra="forbid",
        json_schema_extra={
            "examples": [
                {"marks": [{"user_id": 2, "showed_up": True}, {"user_id": 3, "showed_up": False}]}
            ]
        },
    )

    marks: list[AttendanceMark] = Field(min_length=1)

    @field_validator("marks")
    @classmethod
    def _no_duplicates(cls, marks: list[AttendanceMark]) -> list[AttendanceMark]:
        ids = [m.user_id for m in marks]
        if len(ids) != len(set(ids)):
            raise ValueError("each user_id may appear once")
        return marks


def _check_sport(value: str) -> str:
    sport = value.strip().lower()
    if sport not in ALLOWED_SPORTS:
        raise ValueError(f"sport must be one of: {', '.join(ALLOWED_SPORTS)}")
    return sport


def _check_future(value: datetime) -> datetime:
    if value.tzinfo is None:
        raise ValueError("starts_at must include a timezone, e.g. 2026-10-20T18:00:00-07:00")
    if value <= datetime.now(UTC):
        raise ValueError("starts_at must be in the future")
    return value


class GameCreate(BaseModel):
    """Body of POST /games. Validation mirrors the games table and the Create Post screen."""

    model_config = ConfigDict(
        extra="forbid",
        json_schema_extra={
            "examples": [
                {
                    "sport": "basketball",
                    "venue": "BCIT Gym",
                    "address": "3700 Willingdon Ave, Burnaby",
                    "starts_at": "2026-10-20T18:00:00-07:00",
                    "duration_minutes": 90,
                    "spots": 10,
                    "cost": "5.00",
                    "min_reputation": 80,
                    "fallback_min_reputation": 70,
                    "fallback_hours_before_start": 10,
                }
            ]
        },
    )

    sport: str
    venue: str = Field(min_length=1, max_length=200)
    address: str = Field(min_length=1, max_length=300)
    starts_at: datetime = Field(
        description="Kickoff, in the future, with a timezone offset, e.g. 2026-10-20T18:00:00-07:00"
    )
    duration_minutes: int = Field(default=90, ge=15, le=480)
    spots: int = Field(ge=2, le=30, description="Player places on offer, not counting the host")
    cost: Decimal = Field(
        default=Decimal(0),
        ge=0,
        max_digits=6,
        decimal_places=2,
        description="Venue or drop-in fee per player, for information only. 0 = free",
    )
    min_reputation: int = Field(
        default=0,
        ge=0,
        le=MAX_MIN_REPUTATION,
        description="Lowest reputation allowed to join. 0 = anyone",
    )
    fallback_min_reputation: int | None = Field(
        default=None,
        ge=0,
        le=MAX_MIN_REPUTATION,
        description="Optional lower requirement that replaces min_reputation from "
        "fallback_hours_before_start hours before kickoff. Leave both null for no drop",
    )
    fallback_hours_before_start: int | None = Field(
        default=None, ge=1, le=168, description="When the fallback kicks in, hours before kickoff"
    )

    _sport = field_validator("sport")(_check_sport)
    _starts_at = field_validator("starts_at")(_check_future)


class GameUpdate(BaseModel):
    """Body of PATCH /games/{id}. Every field optional; only sent fields change."""

    model_config = ConfigDict(extra="forbid")

    sport: str | None = None
    venue: str | None = Field(default=None, min_length=1, max_length=200)
    address: str | None = Field(default=None, min_length=1, max_length=300)
    starts_at: datetime | None = None
    duration_minutes: int | None = Field(default=None, ge=15, le=480)
    spots: int | None = Field(default=None, ge=2, le=30)
    cost: Decimal | None = Field(default=None, ge=0, max_digits=6, decimal_places=2)
    min_reputation: int | None = Field(default=None, ge=0, le=MAX_MIN_REPUTATION)
    fallback_min_reputation: int | None = Field(default=None, ge=0, le=MAX_MIN_REPUTATION)
    fallback_hours_before_start: int | None = Field(default=None, ge=1, le=168)

    @field_validator("sport")
    @classmethod
    def _sport(cls, value: str | None) -> str | None:
        return None if value is None else _check_sport(value)

    @field_validator("starts_at")
    @classmethod
    def _starts_at(cls, value: datetime | None) -> datetime | None:
        return None if value is None else _check_future(value)
