from typing import Optional
from pydantic import BaseModel, EmailStr, ConfigDict

class UserBase(BaseModel):
    username: str
    email: EmailStr

class UserCreate(UserBase):
    password: str

class UserUpdate(BaseModel):
    username: Optional[str] = None
    email: Optional[EmailStr] = None
    password: Optional[str] = None
    streak_count: Optional[int] = None
    total_hours: Optional[float] = None
    calories_burned: Optional[int] = None
    xp: Optional[int] = None

class UserResponse(UserBase):
    id: int
    streak_count: int
    total_hours: float
    calories_burned: int
    xp: int

    model_config = ConfigDict(from_attributes=True)
