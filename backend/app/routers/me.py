from fastapi import APIRouter, Query
from sqlalchemy import Select, func, select

from app.deps import CurrentUser, DbDep
from app.models import Follow, Game, Signup, SignupStatus, User
from app.reputation import player_stats
from app.routers.games import summaries
from app.schemas.game import MyGamesOut
from app.schemas.user import FollowedPlayerOut

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


def _player_rows(db: DbDep, user: User, stmt: Select[tuple[User]]) -> list[FollowedPlayerOut]:
    """Run a select(User) and build list rows, with the reputation numbers and whether the
    caller follows each player. Three queries however long the list gets."""
    players = db.scalars(stmt).all()
    if not players:
        return []
    ids = [p.id for p in players]
    stats = player_stats(db, ids)
    followed = set(
        db.scalars(
            select(Follow.followee_id).where(
                Follow.follower_id == user.id, Follow.followee_id.in_(ids)
            )
        )
    )
    return [
        FollowedPlayerOut(
            id=p.id,
            name=p.name,
            reputation=p.reputation,
            games_played=stats[p.id]["games_played"],
            is_new=stats[p.id]["is_new"],
            is_following=p.id in followed,
        )
        for p in players
    ]


@router.get("/following", response_model=list[FollowedPlayerOut])
def my_following(user: CurrentUser, db: DbDep) -> list[FollowedPlayerOut]:
    """The players the signed-in user follows, most recently followed first."""
    stmt = (
        select(User)
        .join(Follow, Follow.followee_id == User.id)
        .where(Follow.follower_id == user.id)
        .order_by(Follow.id.desc())
    )
    return _player_rows(db, user, stmt)


@router.get("/followers", response_model=list[FollowedPlayerOut])
def my_followers(user: CurrentUser, db: DbDep) -> list[FollowedPlayerOut]:
    """The players who follow the signed-in user, newest follower first. `is_following` says
    which of them the user follows back."""
    stmt = (
        select(User)
        .join(Follow, Follow.follower_id == User.id)
        .where(Follow.followee_id == user.id)
        .order_by(Follow.id.desc())
    )
    return _player_rows(db, user, stmt)
