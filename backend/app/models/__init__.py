"""ORM models. Import every model module here so Alembic autogenerate sees it."""

from app.models.attendance import Attendance
from app.models.follow import Follow
from app.models.game import Game, GameStatus
from app.models.signup import Signup, SignupStatus
from app.models.user import User

__all__ = ["Attendance", "Follow", "Game", "GameStatus", "Signup", "SignupStatus", "User"]
