from __future__ import annotations

from datetime import datetime
from typing import TYPE_CHECKING

from sqlalchemy import DateTime, ForeignKey, String, UniqueConstraint, func
from sqlalchemy.orm import Mapped, mapped_column, relationship

from app.db import Base

if TYPE_CHECKING:
    from app.models.game import Game
    from app.models.user import User


class Attendance(Base):
    """The host's record of whether a signed-up player showed up. Written after the game."""

    __tablename__ = "attendance"
    __table_args__ = (UniqueConstraint("game_id", "user_id", name="uq_attendance_game_user"),)

    id: Mapped[int] = mapped_column(primary_key=True)
    game_id: Mapped[int] = mapped_column(ForeignKey("games.id", ondelete="CASCADE"), index=True)
    user_id: Mapped[int] = mapped_column(ForeignKey("users.id"), index=True)
    showed_up: Mapped[bool]
    marked_by: Mapped[int] = mapped_column(ForeignKey("users.id"))
    marked_at: Mapped[datetime] = mapped_column(DateTime(timezone=True), server_default=func.now())
    # The player's reputation just before this game was first marked, and right after the latest
    # mark. Their difference is what this game did to the score. Null on rows older than this.
    reputation_before: Mapped[int | None]
    reputation_after: Mapped[int | None]
    # A player who disagrees with a no-show can dispute once, within the marking window.
    # The host sees the note and may flip the mark. Both null means never disputed.
    disputed_at: Mapped[datetime | None] = mapped_column(DateTime(timezone=True))
    dispute_note: Mapped[str | None] = mapped_column(String(300))

    game: Mapped[Game] = relationship(back_populates="attendance")
    user: Mapped[User] = relationship(foreign_keys=[user_id])
