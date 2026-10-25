"""Shared FastAPI dependencies. Import these in routers instead of repeating Depends(...)."""

from typing import Annotated

import jwt
from fastapi import Depends, HTTPException, status
from fastapi.security import HTTPAuthorizationCredentials, HTTPBearer
from sqlalchemy.orm import Session

from app.db import get_db
from app.models import User
from app.security import decode_access_token

DbDep = Annotated[Session, Depends(get_db)]

# auto_error=False so a missing header gives our own 401 below instead of a 403.
_bearer = HTTPBearer(auto_error=False)


def get_current_user(
    db: DbDep,
    credentials: Annotated[HTTPAuthorizationCredentials | None, Depends(_bearer)],
) -> User:
    """The user behind the Bearer token, or 401."""
    unauthorized = HTTPException(
        status.HTTP_401_UNAUTHORIZED,
        "Not authenticated",
        headers={"WWW-Authenticate": "Bearer"},
    )
    if credentials is None:
        raise unauthorized
    try:
        user_id = decode_access_token(credentials.credentials)
    except jwt.PyJWTError:
        raise unauthorized from None
    user = db.get(User, user_id)
    if user is None:
        raise unauthorized
    return user


CurrentUser = Annotated[User, Depends(get_current_user)]


def get_optional_user(
    db: DbDep,
    credentials: Annotated[HTTPAuthorizationCredentials | None, Depends(_bearer)],
) -> User | None:
    """The user behind the Bearer token if one was sent, else None. A token that is sent but
    bad is still a 401, so a stale token never silently turns into an anonymous request."""
    if credentials is None:
        return None
    return get_current_user(db, credentials)


OptionalUser = Annotated[User | None, Depends(get_optional_user)]
