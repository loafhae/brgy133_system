# Authentication & User Management Router
import os, shutil, uuid
import random
from datetime import datetime, timedelta, timezone
from fastapi import APIRouter, Depends, HTTPException, status, UploadFile, File
from sqlalchemy.orm import Session
from pydantic import BaseModel, EmailStr
from typing import Optional
from app.database import get_db
from app.models.user import User, Admin, Official, Resident
from app.paths import PROFILE_PIC_DIR, UPLOAD_DIR
from app.services.auth_service import hash_password, verify_password, create_access_token, get_current_user
from app.services.email_service import send_otp_email

router = APIRouter(prefix="/api/auth", tags=["auth"])

class LoginRequest(BaseModel):
    username: str
    password: str

class ProfileUpdateRequest(BaseModel):
    username: Optional[str] = None
    first_name: Optional[str] = None
    middle_name: Optional[str] = None
    last_name: Optional[str] = None
    contact: Optional[str] = None
    email: Optional[EmailStr] = None

class RegisterRequest(BaseModel):
    username: str
    email: EmailStr
    password: str
    role: str = "resident"  # Accepts specified role from form registration
    first_name: str = None
    middle_name: str = None
    last_name: str = None
    gender: str = None
    birthday: str = None
    civil_status: str = None
    address: str = None
    mobile_number: str = None

class ForgotPasswordRequest(BaseModel):
    email: EmailStr

class VerifyOTPRequest(BaseModel):
    email: EmailStr
    otp: str

class ResetPasswordRequest(BaseModel):
    email: EmailStr
    otp: str
    new_password: str

@router.post("/login")
def login(body: LoginRequest, db: Session = Depends(get_db)):
    user = db.query(User).filter((User.username == body.username) | (User.email == body.username)).first()
    if not user or not verify_password(body.password, user.password):
        raise HTTPException(status_code=status.HTTP_401_UNAUTHORIZED, detail="Invalid username or password")
    
    if hasattr(user, "is_approved") and user.is_approved == 0:
        raise HTTPException(status_code=status.HTTP_403_FORBIDDEN, detail="Your account is pending Super Admin verification.")

    # Safely parse user roles into a list
    raw_roles = getattr(user, "roles", "resident")
    user_roles = [r.strip() for r in raw_roles.split(",")] if isinstance(raw_roles, str) else (raw_roles if isinstance(raw_roles, list) else [str(raw_roles)])

    primary_role = user_roles[0] if user_roles else "resident"
    access_token = create_access_token(data={"sub": user.username, "role": primary_role})
    
    return {
        "access_token": access_token,
        "token_type": "bearer",
        "role": primary_role,
        "user_id": user.user_id,
        "expires_in": 3600,
        "must_change_password": getattr(user, "must_change_password", False)
    }

def _build_user_response(current_user: User):
    profile_data = None
    sub = getattr(current_user, "admin_profile", None) or getattr(current_user, "official_profile", None) or getattr(current_user, "resident_profile", None)
    if sub:
        profile_data = {
            "first_name": getattr(sub, "first_name", "") or "",
            "middle_name": getattr(sub, "middle_name", "") or "",
            "last_name": getattr(sub, "last_name", "") or "",
            "contact": getattr(sub, "contact", "") or "",
        }

    return {
        "user_id": current_user.user_id,
        "username": current_user.username,
        "email": current_user.email,
        "role": current_user.roles,
        "profile_pic": getattr(current_user, "profile_pic", None),
        "must_change_password": getattr(current_user, "must_change_password", False),
        "profile": profile_data
    }

@router.get("/me")
def get_current_user_profile(db: Session = Depends(get_db), current_user: User = Depends(get_current_user)):
    return _build_user_response(current_user)

@router.post("/upload-profile-pic")
def upload_profile_pic(
    file: UploadFile = File(...),
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user)
):
    if not file or not file.filename:
        raise HTTPException(status_code=400, detail="No file provided.")

    ext = os.path.splitext(file.filename)[1].lower()
    if ext not in [".jpg", ".jpeg", ".png", ".webp", ".gif"]:
        raise HTTPException(status_code=400, detail="Invalid image format. Supported: JPG, PNG, WEBP, GIF.")

    os.makedirs(PROFILE_PIC_DIR, exist_ok=True)
    
    # Remove old profile picture if exists
    if current_user.profile_pic:
        old_file = os.path.basename(current_user.profile_pic)
        old_path = os.path.join(PROFILE_PIC_DIR, old_file)
        if os.path.exists(old_path):
            try:
                os.remove(old_path)
            except Exception:
                pass

    fname = f"user_{current_user.user_id}_{uuid.uuid4().hex[:8]}{ext}"
    fpath = os.path.join(PROFILE_PIC_DIR, fname)
    
    with open(fpath, "wb") as buffer:
        shutil.copyfileobj(file.file, buffer)

    pic_url = f"/uploads/profile_pics/{fname}"
    current_user.profile_pic = pic_url
    db.commit()
    db.refresh(current_user)

    return {
        "profile_pic": pic_url,
        "message": "Profile picture updated successfully.",
        **_build_user_response(current_user)
    }

@router.put("/profile")
def update_profile(
    body: ProfileUpdateRequest,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user)
):
    if body.username and body.username != current_user.username:
        existing = db.query(User).filter(User.username == body.username, User.user_id != current_user.user_id).first()
        if existing:
            raise HTTPException(status_code=400, detail="Username already taken.")
        current_user.username = body.username

    if body.email and body.email != current_user.email:
        existing_email = db.query(User).filter(User.email == body.email, User.user_id != current_user.user_id).first()
        if existing_email:
            raise HTTPException(status_code=400, detail="Email already registered to another account.")
        current_user.email = body.email

    # Update associated role profile
    role = str(current_user.roles).lower()
    if "super_admin" in role or "admin" in role:
        profile = current_user.admin_profile
        if not profile:
            profile = Admin(user_id=current_user.user_id, first_name=body.first_name or "", last_name=body.last_name or "")
            db.add(profile)
        if body.first_name is not None:
            profile.first_name = body.first_name
        if body.middle_name is not None:
            profile.middle_name = body.middle_name
        if body.last_name is not None:
            profile.last_name = body.last_name
        if body.contact is not None:
            profile.contact = body.contact

    elif "official" in role:
        profile = current_user.official_profile
        if not profile:
            profile = Official(user_id=current_user.user_id, first_name=body.first_name or "", last_name=body.last_name or "")
            db.add(profile)
        if body.first_name is not None:
            profile.first_name = body.first_name
        if body.middle_name is not None:
            profile.middle_name = body.middle_name
        if body.last_name is not None:
            profile.last_name = body.last_name
        if body.contact is not None:
            profile.contact = body.contact

    else:
        profile = current_user.resident_profile
        if not profile:
            profile = Resident(user_id=current_user.user_id, first_name=body.first_name or "", last_name=body.last_name or "")
            db.add(profile)
        if body.first_name is not None:
            profile.first_name = body.first_name
        if body.middle_name is not None:
            profile.middle_name = body.middle_name
        if body.last_name is not None:
            profile.last_name = body.last_name
        if body.contact is not None:
            profile.contact = body.contact

    db.commit()
    db.refresh(current_user)
    return _build_user_response(current_user)

@router.post("/register")
def register(body: RegisterRequest, db: Session = Depends(get_db)):
    existing_user = db.query(User).filter((User.username == body.username) | (User.email == body.email)).first()
    if existing_user:
        raise HTTPException(status_code=400, detail="Username or email already registered.")

    assigned_role = body.role if body.role else "resident"

    new_user = User(
        username=body.username,
        email=body.email,
        password=hash_password(body.password),
        roles=assigned_role,
        is_approved=0  # Requires verification by Super Admin for barangay 133 clearance
    )
    db.add(new_user)
    db.commit()
    db.refresh(new_user)

    new_resident = Resident(
        user_id=new_user.user_id,
        first_name=body.first_name,
        last_name=body.last_name,
        contact=body.mobile_number,
        address=body.address
    )
    db.add(new_resident)
    db.commit()

    return {"message": "Registration successful. Pending Super Admin verification."}

@router.post("/forgot-password")
def forgot_password(body: ForgotPasswordRequest, db: Session = Depends(get_db)):
    user = db.query(User).filter(User.email == body.email).first()
    if not user:
        return {"message": "If the email exists, a verification code has been sent."}
    
    otp_code = str(random.randint(100000, 999999))
    user.reset_otp = otp_code
    user.otp_expiry = datetime.now(timezone.utc) + timedelta(minutes=10)
    db.commit()
    
    send_otp_email(body.email, otp_code)
    
    return {"message": "Verification code sent to email."}

@router.post("/verify-otp")
def verify_otp(body: VerifyOTPRequest, db: Session = Depends(get_db)):
    user = db.query(User).filter(User.email == body.email).first()
    if not user or user.reset_otp != body.otp:
        raise HTTPException(status_code=400, detail="Invalid verification code.")
    
    if user.otp_expiry and user.otp_expiry.replace(tzinfo=timezone.utc) < datetime.now(timezone.utc):
        raise HTTPException(status_code=400, detail="Verification code has expired.")
        
    return {"message": "OTP verified successfully."}

@router.post("/reset-password")
def reset_password(body: ResetPasswordRequest, db: Session = Depends(get_db)):
    user = db.query(User).filter(User.email == body.email).first()
    if not user or user.reset_otp != body.otp:
        raise HTTPException(status_code=400, detail="Invalid request or token.")
        
    user.password = hash_password(body.new_password)
    user.reset_otp = None
    user.otp_expiry = None
    db.commit()
    
    return {"message": "Password successfully reset."}