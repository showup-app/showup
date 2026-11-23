from __future__ import annotations

from datetime import datetime

from sqlalchemy import CheckConstraint, DateTime, ForeignKey, UniqueConstraint, func
from sqlalchemy.orm import Mapped, mapped_column

from app.db import Base


class Follow(Base):
    """One player following another. One-way and needs no approval: a row here only means
    the follower sees the followee's games in the "People I follow" filter."""

    __tablename__ = "follows"
    __table_args__ = (
        UniqueConstraint("follower_id", "followee_id", name="uq_follows_follower_followee"),
        CheckConstraint("follower_id <> followee_id", name="ck_follows_not_self"),
    )

    id: Mapped[int] = mapped_column(primary_key=True)
    # CASCADE: a follow has no meaning once either user is gone. It also lets the seed
    # scripts delete and recreate their users after someone has followed them.
    follower_id: Mapped[int] = mapped_column(ForeignKey("users.id", ondelete="CASCADE"), index=True)
    followee_id: Mapped[int] = mapped_column(ForeignKey("users.id", ondelete="CASCADE"), index=True)
    created_at: Mapped[datetime] = mapped_column(DateTime(timezone=True), server_default=func.now())
