from pydantic import BaseModel
from typing import Optional
from datetime import datetime


class UserCreate(BaseModel):
    username: str
    password: str
    roles: str


class UserUpdate(BaseModel):
    username: Optional[str] = None
    password: Optional[str] = None
    roles: Optional[str] = None
    is_active: Optional[bool] = None


class UserResponse(BaseModel):
    user_id: int
    username: str
    roles: str
    is_active: bool
    created_at: Optional[datetime] = None

    class Config:
        from_attributes = True
