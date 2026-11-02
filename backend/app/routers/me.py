from fastapi import APIRouter, Query
from sqlalchemy import func, select

from app.deps import CurrentUser, DbDep
from app.models import Game, Signup, SignupStatus
from app.routers.games import summaries
from app.schemas.game import MyGamesOut

router = APIRouter(prefix="/me", tags=["me"])


@router.get("/games", response_model=MyGamesOut)
def my_games(
    user: CurrentUser,
    db: DbDep,
    include_past: bool = Query(False, description="Also return games that already started"),
) -> MyGamesOut:
    """The signed-in user's games: the ones they host and the ones they joined. Cancelled games
    stay in both lists with status "cancelled", so a player sees that it was cancelled instead of
    it silently disappearing. Explore (GET /games) is where cancelled games are hidden."""
    hosting = select(Game).where(Game.host_id == user.id).order_by(Game.starts_at)
    joined = (
        select(Game)
        .join(Signup, Signup.game_id == Game.id)
        .where(
            Signup.user_id == user.id,
            Signup.status == SignupStatus.JOINED,
        )
        .order_by(Game.starts_at)
    )
    if not include_past:
        hosting = hosting.where(Game.starts_at >= func.now())
        joined = joined.where(Game.starts_at >= func.now())
    return MyGamesOut(hosting=summaries(db, hosting, user), joined=summaries(db, joined, user))
