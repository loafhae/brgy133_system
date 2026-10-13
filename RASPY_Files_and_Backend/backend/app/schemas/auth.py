from pydantic import BaseModel
from typing import Optional

class Token(BaseModel):
    access_token: str
    token_type: str

class LoginRequest(BaseModel):
    username: str
    password: str

class UserResponse(BaseModel):
    user_id: int
    username: str
    email: Optional[str] = None
    roles: Optional[str] = None
    profile_pic: Optional[str] = None
    is_approved: Optional[int] = 1

    class Config:
        from_attributes = True

class ProfileUpdate(BaseModel):
    username: Optional[str] = None
    email: Optional[str] = None
    first_name: Optional[str] = None
    middle_name: Optional[str] = None
    last_name: Optional[str] = None
    contact: Optional[str] = None

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
    roles: str = 'official'
    first_name: str
    middle_name: Optional[str] = ''
    last_name: str
    gender: Optional[str] = None
    birthday: Optional[str] = None
    civil_status: Optional[str] = None
    address: Optional[str] = None
    mobile: Optional[str] = None