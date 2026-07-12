from pydantic import BaseModel
from typing import Optional

class UserCreate(BaseModel):
    username: str
    password: str
    roles: str

class UserUpdate(BaseModel):
    username: Optional[str] = None
    password: Optional[str] = None
    roles: Optional[str] = None

class UserResponse(BaseModel):
    user_id: int
    username: str
    roles: str

    class Config:
        from_attributes = True