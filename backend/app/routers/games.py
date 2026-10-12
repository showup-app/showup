from datetime import UTC, datetime

from fastapi import APIRouter, HTTPException, Query, status
from sqlalchemy import func, or_, select
from sqlalchemy.orm import selectinload

from app.deps import CurrentUser, DbDep
from app.models import Game, GameStatus, Signup, SignupStatus, User
from app.reputation import effective_min_reputation, player_stats
from app.schemas.game import (
    GameCreate,
    GameDetailOut,
    GameOut,
    GameSummaryOut,
    GameUpdate,
    PlayerOut,
)

router = APIRouter(prefix="/games", tags=["games"])


# ---------- helpers ----------


def _get_game_or_404(db: DbDep, game_id: int, *, lock: bool = False) -> Game:
    stmt = select(Game).where(Game.id == game_id)
    if lock:
        # Row lock so two players cannot both take the last spot.
        stmt = stmt.with_for_update()
    game = db.scalar(stmt)
    if game is None:
        raise HTTPException(status.HTTP_404_NOT_FOUND, "Game not found")
    return game


def _require_host(game: Game, user: User) -> None:
    if game.host_id != user.id:
        raise HTTPException(status.HTTP_403_FORBIDDEN, "Only the host can do this")


def _joined_count(db: DbDep, game_id: int) -> int:
    stmt = (
        select(func.count())
        .select_from(Signup)
        .where(Signup.game_id == game_id, Signup.status == SignupStatus.JOINED)
    )
    return db.scalar(stmt) or 0


def _summary(game: Game, joined: int) -> GameSummaryOut:
    """The list row for a game whose host is already loaded."""
    return GameSummaryOut(
        **GameOut.model_validate(game).model_dump(),
        host_name=game.host.name,
        host_reputation=game.host.reputation,
        spots_left=max(game.spots - joined, 0),
    )


def _detail(db: DbDep, game_id: int) -> GameDetailOut:
    stmt = (
        select(Game)
        .where(Game.id == game_id)
        .options(selectinload(Game.host), selectinload(Game.signups).selectinload(Signup.user))
    )
    game = db.scalar(stmt)
    if game is None:
        raise HTTPException(status.HTTP_404_NOT_FOUND, "Game not found")
    joined = sorted(
        (s for s in game.signups if s.status == SignupStatus.JOINED),
        key=lambda s: (s.created_at, s.id),
    )
    stats = player_stats(db, [s.user_id for s in joined])
    players = [
        PlayerOut(
            id=s.user.id,
            name=s.user.name,
            reputation=s.user.reputation,
            games_played=stats[s.user_id]["games_played"],
            is_new=stats[s.user_id]["is_new"],
        )
        for s in joined
    ]
    return GameDetailOut(
        **_summary(game, len(players)).model_dump(),
        players=players,
        effective_min_reputation=effective_min_reputation(game),
    )


def _escape_like(text: str) -> str:
    r"""Treat %, _ and \ in user input as literal characters inside a LIKE pattern."""
    return text.replace("\\", "\\\\").replace("%", "\\%").replace("_", "\\_")


# ---------- reading ----------


@router.get("", response_model=list[GameSummaryOut])
def list_games(
    db: DbDep,
    sport: str | None = Query(None, description="Only this sport, case-insensitive"),
    location: str | None = Query(
        None,
        min_length=2,
        max_length=100,
        description="Only games whose venue or address contains this text, e.g. burnaby",
    ),
    include_past: bool = Query(False, description="Also return games that already started"),
) -> list[GameSummaryOut]:
    """Upcoming games, soonest first, each with its host and places left. Cancelled games are
    never listed."""
    # One grouped count of joined players per game, joined in, so the list is two queries
    # (games + hosts) however long it gets.
    joined = (
        select(Signup.game_id, func.count().label("joined"))
        .where(Signup.status == SignupStatus.JOINED)
        .group_by(Signup.game_id)
        .subquery()
    )
    stmt = (
        select(Game, func.coalesce(joined.c.joined, 0))
        .outerjoin(joined, joined.c.game_id == Game.id)
        .options(selectinload(Game.host))
        .where(Game.status != GameStatus.CANCELLED)
        .order_by(Game.starts_at)
    )
    if sport:
        stmt = stmt.where(func.lower(Game.sport) == sport.lower())
    if location:
        pattern = f"%{_escape_like(location)}%"
        stmt = stmt.where(
            or_(Game.venue.ilike(pattern, escape="\\"), Game.address.ilike(pattern, escape="\\"))
        )
    if not include_past:
        stmt = stmt.where(Game.starts_at >= func.now())
    return [_summary(game, count) for game, count in db.execute(stmt)]


@router.get("/{game_id}", response_model=GameDetailOut)
def get_game(game_id: int, db: DbDep) -> GameDetailOut:
    """One game with its host, the players who have joined (oldest signup first), and the
    reputation requirement that applies right now."""
    return _detail(db, game_id)


# ---------- hosting ----------


@router.post("", status_code=status.HTTP_201_CREATED, response_model=GameOut)
def create_game(body: GameCreate, db: DbDep, user: CurrentUser) -> Game:
    """Post a game. The caller becomes the host."""
    game = Game(host_id=user.id, **body.model_dump())
    db.add(game)
    db.commit()
    db.refresh(game)
    return game


@router.patch("/{game_id}", response_model=GameOut)
def update_game(game_id: int, body: GameUpdate, db: DbDep, user: CurrentUser) -> Game:
    """Change a game's details. Host only. Cancelled or played games cannot change."""
    game = _get_game_or_404(db, game_id)
    _require_host(game, user)
    if game.status in (GameStatus.CANCELLED, GameStatus.PLAYED):
        raise HTTPException(status.HTTP_409_CONFLICT, f"Game is {game.status.value}")
    changes = body.model_dump(exclude_unset=True)
    if not changes:
        raise HTTPException(status.HTTP_422_UNPROCESSABLE_CONTENT, "Nothing to update")
    for field, value in changes.items():
        setattr(game, field, value)
    if "spots" in changes:
        game.status = (
            GameStatus.FULL if _joined_count(db, game.id) >= game.spots else GameStatus.OPEN
        )
    db.commit()
    db.refresh(game)
    return game


@router.post("/{game_id}/cancel", response_model=GameOut)
def cancel_game(game_id: int, db: DbDep, user: CurrentUser) -> Game:
    """Cancel a game. Host only. The row stays so players can be told later."""
    game = _get_game_or_404(db, game_id)
    _require_host(game, user)
    if game.status == GameStatus.CANCELLED:
        raise HTTPException(status.HTTP_409_CONFLICT, "Game is already cancelled")
    if game.status == GameStatus.PLAYED:
        raise HTTPException(status.HTTP_409_CONFLICT, "Game has already been played")
    game.status = GameStatus.CANCELLED
    db.commit()
    db.refresh(game)
    return game


# ---------- playing ----------


@router.post("/{game_id}/join", status_code=status.HTTP_201_CREATED, response_model=GameDetailOut)
def join_game(game_id: int, db: DbDep, user: CurrentUser) -> GameDetailOut:
    """Take a spot. Rejected when the game is full, cancelled, started, or below your reputation."""
    game = _get_game_or_404(db, game_id, lock=True)
    if game.host_id == user.id:
        raise HTTPException(status.HTTP_409_CONFLICT, "Hosts are already in their own game")
    if game.status == GameStatus.CANCELLED:
        raise HTTPException(status.HTTP_409_CONFLICT, "Game is cancelled")
    if game.starts_at <= datetime.now(UTC):
        raise HTTPException(status.HTTP_409_CONFLICT, "Game has already started")
    required = effective_min_reputation(game)
    if user.reputation < required:
        raise HTTPException(
            status.HTTP_403_FORBIDDEN,
            f"This game needs a reputation of {required}; yours is {user.reputation}",
        )

    signup = db.scalar(select(Signup).where(Signup.game_id == game.id, Signup.user_id == user.id))
    if signup is not None and signup.status == SignupStatus.JOINED:
        raise HTTPException(status.HTTP_409_CONFLICT, "You have already joined this game")
    if signup is not None and signup.status == SignupStatus.REMOVED:
        raise HTTPException(status.HTTP_403_FORBIDDEN, "The host removed you from this game")

    joined = _joined_count(db, game.id)
    if joined >= game.spots:
        raise HTTPException(status.HTTP_409_CONFLICT, "Game is full")

    if signup is None:
        db.add(Signup(game_id=game.id, user_id=user.id, status=SignupStatus.JOINED))
    else:
        signup.status = SignupStatus.JOINED
    if joined + 1 >= game.spots:
        game.status = GameStatus.FULL
    db.commit()
    return _detail(db, game.id)


@router.delete("/{game_id}/join", response_model=GameDetailOut)
def leave_game(game_id: int, db: DbDep, user: CurrentUser) -> GameDetailOut:
    """Give up your spot. Frees the game if it was full."""
    game = _get_game_or_404(db, game_id, lock=True)
    signup = db.scalar(
        select(Signup).where(
            Signup.game_id == game.id,
            Signup.user_id == user.id,
            Signup.status == SignupStatus.JOINED,
        )
    )
    if signup is None:
        raise HTTPException(status.HTTP_404_NOT_FOUND, "You are not in this game")
    db.delete(signup)
    if game.status == GameStatus.FULL:
        game.status = GameStatus.OPEN
    db.commit()
    return _detail(db, game.id)
