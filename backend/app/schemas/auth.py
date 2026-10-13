from pydantic import BaseModel, EmailStr, Field


class SignupRequest(BaseModel):
    email: EmailStr
    password: str = Field(min_length=8, max_length=128)
    name: str = Field(min_length=1, max_length=100)


class UserOut(BaseModel):
    id: int
    email: str
    name: str
    reputation: int
    model_config = {"from_attributes": True}
