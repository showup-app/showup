from pydantic import BaseModel, EmailStr, Field, field_validator


class SignupRequest(BaseModel):
    email: EmailStr
    password: str = Field(min_length=8, max_length=128)
    name: str = Field(min_length=1, max_length=100)

    @field_validator("name")
    @classmethod
    def _strip_name(cls, value: str) -> str:
        name = value.strip()
        if not name:
            raise ValueError("name cannot be blank")
        return name


class UserOut(BaseModel):
    id: int
    email: str
    name: str
    reputation: int
    model_config = {"from_attributes": True}


class ProfileOut(UserOut):
    """GET /auth/me: the user plus the numbers the Profile screen shows next to the score."""

    games_played: int = Field(description="Games this player was marked present at")
    games_hosted: int = Field(description="Games this user hosted that were played")
    is_new: bool = Field(
        description="True until 3 marked or hosted games; the app shows 'New' instead of the score"
    )


class LoginRequest(BaseModel):
    email: str
    password: str

    @field_validator("email")
    @classmethod
    def _strip_email(cls, value: str) -> str:
        return value.strip()


class TokenResponse(BaseModel):
    access_token: str
    token_type: str = "bearer"
