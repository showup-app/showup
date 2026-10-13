from fastapi import APIRouter, HTTPException, status
from sqlalchemy import select
from sqlalchemy.exc import IntegrityError

from app.deps import DbDep
from app.models import User
from app.schemas.auth import SignupRequest, UserOut
from app.security import hash_password

router = APIRouter(prefix="/auth", tags=["auth"])


@router.post("/signup", response_model=UserOut, status_code=status.HTTP_201_CREATED)
def signup(body: SignupRequest, db: DbDep):
    email = body.email.lower()
    if db.scalar(select(User).where(User.email == email)):
        raise HTTPException(status.HTTP_409_CONFLICT, "Email already registered")
    user = User(email=email, name=body.name, password_hash=hash_password(body.password))
    db.add(user)
    try:
        db.commit()
    except IntegrityError:
        db.rollback()
        raise HTTPException(status.HTTP_409_CONFLICT, "Email already registered") from None
    db.refresh(user)
    return user
