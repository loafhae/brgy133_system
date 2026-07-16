from pydantic import BaseModel
from typing import Optional
from datetime import datetime, date

class UserCreate(BaseModel):
    username: str
    password: str
    roles: str
    first_name: Optional[str] = None
    middle_name: Optional[str] = None
    last_name: Optional[str] = None
    gender: Optional[str] = None
    birthday: Optional[date] = None
    address: Optional[str] = None
    contact: Optional[str] = None
    civil_status: Optional[str] = None
    email: Optional[str] = None

class UserUpdate(BaseModel):
    username: Optional[str] = None
    password: Optional[str] = None
    roles: Optional[str] = None
    is_active: Optional[bool] = None
    first_name: Optional[str] = None
    middle_name: Optional[str] = None
    last_name: Optional[str] = None
    gender: Optional[str] = None
    birthday: Optional[date] = None
    address: Optional[str] = None
    contact: Optional[str] = None
    civil_status: Optional[str] = None
    email: Optional[str] = None

class UserResponse(BaseModel):
    user_id: int
    username: str
    roles: str
    is_active: Optional[bool] = True
    created_at: Optional[datetime] = None
    profile_pic: Optional[str] = None
    first_name: Optional[str] = None
    middle_name: Optional[str] = None
    last_name: Optional[str] = None
    gender: Optional[str] = None
    birthday: Optional[str] = None
    address: Optional[str] = None
    contact: Optional[str] = None
    civil_status: Optional[str] = None
    email: Optional[str] = None

    class Config:
        from_attributes = True