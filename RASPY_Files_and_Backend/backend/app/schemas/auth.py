from pydantic import BaseModel, Field, field_validator, model_validator
from typing import Optional
from datetime import date
from app.services.phone import normalize_philippine_mobile

class Token(BaseModel):
    access_token: Optional[str] = None
    token_type: str
    role: Optional[str] = None
    roles: Optional[str] = None
    idle_timeout_minutes: int
    absolute_timeout_minutes: int


class MfaVerifyRequest(BaseModel):
    otp: str = Field(..., min_length=6, max_length=6, pattern=r"^\d{6}$")

class LoginRequest(BaseModel):
    username: str = Field(..., min_length=1)
    password: str = Field(..., min_length=1)
    required_role: Optional[str] = None

class UserResponse(BaseModel):
    user_id: int
    username: str
    email: Optional[str] = None
    roles: Optional[str] = None
    role: Optional[str] = None
    profile_pic: Optional[str] = None
    is_approved: Optional[int] = 1
    first_name: Optional[str] = None
    middle_name: Optional[str] = None
    last_name: Optional[str] = None
    birthday: Optional[date] = None
    gender: Optional[str] = None
    address: Optional[str] = Field(default=None, max_length=500)
    contact: Optional[str] = None
    civil_status: Optional[str] = None

    class Config:
        from_attributes = True

class ProfileUpdate(BaseModel):
    username: Optional[str] = None
    email: Optional[str] = None
    first_name: Optional[str] = None
    middle_name: Optional[str] = None
    last_name: Optional[str] = None
    contact: Optional[str] = None
    birthday: Optional[date] = None
    gender: Optional[str] = Field(default=None, max_length=100)
    address: Optional[str] = Field(default=None, max_length=500)
    civil_status: Optional[str] = None

    @field_validator("contact")
    @classmethod
    def validate_contact(cls, value):
        if value is None:
            return value
        return normalize_philippine_mobile(value)

    @field_validator("civil_status")
    @classmethod
    def validate_civil_status(cls, value):
        if value is None or value == "":
            return value
        if value not in {"Single", "Married", "Widowed", "Separated"}:
            raise ValueError("Choose a supported civil status.")
        return value

class ChangePasswordRequest(BaseModel):
    current_password: str
    new_password: str

class ForgotPasswordRequest(BaseModel):
    email: str

class VerifyOtpRequest(BaseModel):
    email: str
    otp: str

class ResetPasswordRequest(BaseModel):
    email: str
    otp: str
    new_password: str

class RegisterRequest(BaseModel):
    username: str
    email: str
    password: str
    confirmPassword: Optional[str] = None
    roles: str = 'resident'
    first_name: str
    middle_name: Optional[str] = ''
    last_name: str
    gender: Optional[str] = Field(default=None, max_length=100)
    birthday: Optional[str] = None
    civil_status: Optional[str] = None
    address: Optional[str] = None
    mobile: str
    mobile_number: Optional[str] = None
    privacy_consent: Optional[bool] = False

    @model_validator(mode="before")
    @classmethod
    def use_mobile_number_alias(cls, values):
        if isinstance(values, dict) and not values.get("mobile") and values.get("mobile_number"):
            values = {**values, "mobile": values["mobile_number"]}
        return values

    @field_validator("mobile")
    @classmethod
    def validate_mobile(cls, value):
        return normalize_philippine_mobile(value)

    class Config:
        extra = "ignore"