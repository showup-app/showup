from fastapi import APIRouter, Query
from sqlalchemy import func, select

from app.deps import CurrentUser, DbDep
from app.models import Game, GameStatus, Signup, SignupStatus
from app.routers.games import summaries
from app.schemas.game import MyGamesOut

router = APIRouter(prefix="/me", tags=["me"])


@router.get("/games", response_model=MyGamesOut)
def my_games(
    user: CurrentUser,
    db: DbDep,
    include_past: bool = Query(False, description="Also return games that already started"),
) -> MyGamesOut:
    """The signed-in user's games: the ones they host and the ones they joined. A host still
    sees their own cancelled games; cancelled games drop out of joined."""
    hosting = select(Game).where(Game.host_id == user.id).order_by(Game.starts_at)
    joined = (
        select(Game)
        .join(Signup, Signup.game_id == Game.id)
        .where(
            Signup.user_id == user.id,
            Signup.status == SignupStatus.JOINED,
            Game.status != GameStatus.CANCELLED,
        )
        .order_by(Game.starts_at)
    )
    if not include_past:
        hosting = hosting.where(Game.starts_at >= func.now())
        joined = joined.where(Game.starts_at >= func.now())
    return MyGamesOut(hosting=summaries(db, hosting), joined=summaries(db, joined))
