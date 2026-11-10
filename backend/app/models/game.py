from __future__ import annotations

import enum
from datetime import datetime
from decimal import Decimal
from typing import TYPE_CHECKING

from sqlalchemy import CheckConstraint, DateTime, Enum, ForeignKey, Numeric, String, func
from sqlalchemy.orm import Mapped, mapped_column, relationship

from app.db import Base

if TYPE_CHECKING:
    from app.models.attendance import Attendance
    from app.models.signup import Signup
    from app.models.user import User


class GameStatus(enum.StrEnum):
    OPEN = "open"
    FULL = "full"
    CANCELLED = "cancelled"
    PLAYED = "played"


class Game(Base):
    __tablename__ = "games"
    __table_args__ = (
        CheckConstraint("spots BETWEEN 2 AND 30", name="ck_games_spots_range"),
        CheckConstraint("cost >= 0", name="ck_games_cost_not_negative"),
        CheckConstraint("min_reputation BETWEEN 0 AND 100", name="ck_games_min_reputation_range"),
        CheckConstraint(
            "fallback_min_reputation IS NULL OR fallback_min_reputation BETWEEN 0 AND 100",
            name="ck_games_fallback_min_reputation_range",
        ),
        CheckConstraint(
            "fallback_hours_before_start IS NULL OR fallback_hours_before_start BETWEEN 1 AND 168",
            name="ck_games_fallback_hours_range",
        ),
        CheckConstraint("duration_minutes BETWEEN 15 AND 480", name="ck_games_duration_range"),
    )

    id: Mapped[int] = mapped_column(primary_key=True)
    host_id: Mapped[int] = mapped_column(ForeignKey("users.id"), index=True)
    # Free text in sprint 1 (basketball, soccer, ...); the request schema holds the allowed list.
    sport: Mapped[str] = mapped_column(String(50), index=True)
    venue: Mapped[str] = mapped_column(String(200))
    address: Mapped[str] = mapped_column(String(300))
    starts_at: Mapped[datetime] = mapped_column(DateTime(timezone=True), index=True)
    # How long the game runs; the app uses it to know when to ask the host to mark attendance.
    duration_minutes: Mapped[int] = mapped_column(default=90, server_default="90")
    spots: Mapped[int]
    # Total venue cost entered by the host. The per-player share is calculated. 0 means free.
    cost: Mapped[Decimal] = mapped_column(Numeric(6, 2), default=0, server_default="0")
    # 0 means anyone can join.
    min_reputation: Mapped[int] = mapped_column(default=0, server_default="0")
    # Optional one-step drop: within `fallback_hours_before_start` of kickoff the requirement
    # becomes `fallback_min_reputation`. Both null means no drop. See app.reputation.
    fallback_min_reputation: Mapped[int | None]
    fallback_hours_before_start: Mapped[int | None]
    # Stored as plain text ("open"), not a Postgres enum type, so adding a value is a
    # one-line change. values_callable makes SQLAlchemy store .value, not the member name.
    status: Mapped[GameStatus] = mapped_column(
        Enum(
            GameStatus,
            native_enum=False,
            length=20,
            values_callable=lambda e: [m.value for m in e],
        ),
        default=GameStatus.OPEN,
        server_default=GameStatus.OPEN.value,
    )
    created_at: Mapped[datetime] = mapped_column(DateTime(timezone=True), server_default=func.now())
    # Bumped by the database on every change, so "what changed since I joined" is answerable.
    updated_at: Mapped[datetime] = mapped_column(
        DateTime(timezone=True), server_default=func.now(), onupdate=func.now()
    )

    host: Mapped[User] = relationship(back_populates="hosted_games")
    signups: Mapped[list[Signup]] = relationship(
        back_populates="game", cascade="all, delete-orphan"
    )
    attendance: Mapped[list[Attendance]] = relationship(
        back_populates="game", cascade="all, delete-orphan"
    )
