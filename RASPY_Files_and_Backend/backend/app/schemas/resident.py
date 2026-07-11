from pydantic import BaseModel
from typing import Optional
from datetime import date


class ResidentCreate(BaseModel):
    username: str
    password: str
    first_name: str
    middle_name: Optional[str] = None
    last_name: str
    birthday: Optional[date] = None
    gender: Optional[str] = None
    address: Optional[str] = None
    contact: Optional[str] = None
    civil_status: Optional[str] = None
    email: Optional[str] = None


class ResidentUpdate(BaseModel):
    first_name: Optional[str] = None
    middle_name: Optional[str] = None
    last_name: Optional[str] = None
    birthday: Optional[date] = None
    gender: Optional[str] = None
    address: Optional[str] = None
    contact: Optional[str] = None
    civil_status: Optional[str] = None
    email: Optional[str] = None


class ResidentResponse(BaseModel):
    resident_id: int
    user_id: int
    first_name: str
    middle_name: Optional[str] = None
    last_name: str
    birthday: Optional[date] = None
    gender: Optional[str] = None
    address: Optional[str] = None
    contact: Optional[str] = None
    civil_status: Optional[str] = None
    email: Optional[str] = None

    class Config:
        from_attributes = True


class FCMTokenUpdate(BaseModel):
    fcm_token: str
