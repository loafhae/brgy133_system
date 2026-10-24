from pydantic import BaseModel, field_validator
from typing import Optional
from datetime import date
from app.services.phone import normalize_philippine_mobile


class ResidentCreate(BaseModel):
    username: str
    password: str
    first_name: str
    middle_name: Optional[str] = None
    last_name: str
    birthday: Optional[date] = None
    gender: Optional[str] = None
    address: Optional[str] = None
    contact: str
    civil_status: Optional[str] = None
    email: Optional[str] = None

    @field_validator("contact")
    @classmethod
    def validate_contact(cls, value):
        return normalize_philippine_mobile(value)


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

    @field_validator("contact")
    @classmethod
    def validate_contact(cls, value):
        if value is None:
            return value
        return normalize_philippine_mobile(value)


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