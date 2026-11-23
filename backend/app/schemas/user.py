from pydantic import BaseModel, Field


class PublicProfileOut(BaseModel):
    """What one player may see about another. Never the email, the password hash or the
    attendance history: see docs/decisions/0003-following.md."""

    id: int
    name: str
    reputation: int
    games_played: int = Field(description="Games this player was marked present at")
    games_hosted: int = Field(description="Games this user hosted that were played")
    is_new: bool = Field(
        description="True until 3 marked or hosted games; the app shows 'New' instead of the score"
    )
    followers_count: int = Field(description="Players who follow this player")
    following_count: int = Field(description="Players this player follows")
    is_following: bool = Field(
        description="True when the caller's Bearer token belongs to a player who follows this "
        "one. Always false without a token"
    )
