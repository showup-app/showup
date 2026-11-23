from fastapi import APIRouter, HTTPException, status
from sqlalchemy import delete, func, select
from sqlalchemy.exc import IntegrityError

from app.deps import CurrentUser, DbDep
from app.models import Follow, User
from app.reputation import player_stats
from app.schemas.user import PublicProfileOut

router = APIRouter(prefix="/users", tags=["users"])


def _get_user_or_404(db: DbDep, user_id: int) -> User:
    user = db.get(User, user_id)
    if user is None:
        raise HTTPException(status.HTTP_404_NOT_FOUND, "User not found")
    return user


def public_profile(db: DbDep, user: User, viewer: User | None) -> PublicProfileOut:
    """The public view of `user` as `viewer` sees it. Counts are computed on read; see
    decision 0003 for when they would move onto the users table."""
    followers = db.scalar(select(func.count()).where(Follow.followee_id == user.id)) or 0
    following = db.scalar(select(func.count()).where(Follow.follower_id == user.id)) or 0
    is_following = viewer is not None and (
        db.scalar(
            select(Follow.id).where(Follow.follower_id == viewer.id, Follow.followee_id == user.id)
        )
        is not None
    )
    return PublicProfileOut(
        id=user.id,
        name=user.name,
        reputation=user.reputation,
        followers_count=followers,
        following_count=following,
        is_following=is_following,
        **player_stats(db, [user.id])[user.id],
    )


@router.post(
    "/{user_id}/follow", status_code=status.HTTP_201_CREATED, response_model=PublicProfileOut
)
def follow_user(user_id: int, db: DbDep, user: CurrentUser) -> PublicProfileOut:
    """Follow a player. Returns their profile with the new follower count."""
    if user_id == user.id:
        raise HTTPException(status.HTTP_422_UNPROCESSABLE_CONTENT, "You cannot follow yourself")
    target = _get_user_or_404(db, user_id)
    db.add(Follow(follower_id=user.id, followee_id=target.id))
    try:
        db.commit()
    except IntegrityError:
        # The unique pair is the only constraint that can fail here: self-follow and a missing
        # user were ruled out above. Letting the database decide also covers a double tap.
        db.rollback()
        raise HTTPException(status.HTTP_409_CONFLICT, "You already follow this player") from None
    return public_profile(db, target, user)


@router.delete("/{user_id}/follow", response_model=PublicProfileOut)
def unfollow_user(user_id: int, db: DbDep, user: CurrentUser) -> PublicProfileOut:
    """Stop following a player. Returns their profile with the new follower count."""
    target = _get_user_or_404(db, user_id)
    removed = db.execute(
        delete(Follow).where(Follow.follower_id == user.id, Follow.followee_id == target.id)
    )
    if removed.rowcount == 0:
        raise HTTPException(status.HTTP_404_NOT_FOUND, "You do not follow this player")
    db.commit()
    return public_profile(db, target, user)
