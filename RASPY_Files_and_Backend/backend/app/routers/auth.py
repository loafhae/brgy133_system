import logging
import os
import uuid
import random
import string
from datetime import datetime, timedelta, timezone
from typing import Optional
from fastapi import APIRouter, Depends, HTTPException, Request, status, UploadFile, File
from sqlalchemy.exc import SQLAlchemyError
from sqlalchemy.orm import Session

from app.database import get_db
from app.models.user import User
from app.schemas.auth import Token, LoginRequest, UserResponse, ProfileUpdate, ChangePasswordRequest, ForgotPasswordRequest, VerifyOtpRequest, ResetPasswordRequest, RegisterRequest
from app.models.user import Admin, Official, Resident
from app.models.audit import AuditLog
from app.services.auth_service import verify_password, hash_password, create_access_token
from app.services.email_service import send_otp_email
from app.dependencies import get_current_user

router = APIRouter(prefix="/auth", tags=["auth"])
logger = logging.getLogger(__name__)

UPLOAD_DIR = "uploads/profiles"
os.makedirs(UPLOAD_DIR, exist_ok=True)


@router.post("/login", response_model=Token)
def login(
    payload: LoginRequest,
    request: Request,
    db: Session = Depends(get_db)
):
    request.state.audit_attempted_username = payload.username
    user = db.query(User).filter(User.username == payload.username).first()
    if not user or not verify_password(payload.password, user.password):
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="Incorrect username or password",
        )
    
    if not user.is_approved:
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail="Account is pending approval by administrator."
        )

    access_token_expires = timedelta(days=7)
    access_token = create_access_token(
        data={"sub": user.username, "roles": user.roles}, expires_in=access_token_expires
    )
    try:
        db.add(AuditLog(
            user_id=user.user_id,
            action_type="login",
            target_table="tbl_users",
            target_id=user.user_id,
            description="Successful login",
            ip_address=getattr(request.state, "client_ip", None),
        ))
        db.commit()
    except SQLAlchemyError:
        db.rollback()
        logger.exception("Could not record successful login activity for user_id=%s", user.user_id)
    return {"access_token": access_token, "token_type": "bearer"}


@router.post("/register")
def register(body: RegisterRequest, request: Request, db: Session = Depends(get_db)):
    # Check duplicate username
    existing = db.query(User).filter(User.username == body.username).first()
    if existing:
        raise HTTPException(status_code=400, detail="Username already taken.")

    # Check duplicate email
    if body.email:
        existing_email = db.query(User).filter(User.email == body.email).first()
        if existing_email:
            raise HTTPException(status_code=400, detail="Email already registered.")

    role = body.roles.strip().lower() if body.roles else 'official'
    is_approved = 1 if role != 'resident' else 0

    new_user = User(
        username=body.username,
        email=body.email,
        password=hash_password(body.password),
        roles=role,
        is_approved=is_approved,
    )
    db.add(new_user)
    db.commit()
    db.refresh(new_user)

    # Create profile based on role
    if role == 'resident':
        profile = Resident(
            user_id=new_user.user_id,
            first_name=body.first_name,
            middle_name=body.middle_name or '',
            last_name=body.last_name,
            gender=body.gender,
            birthday=body.birthday,
            civil_status=body.civil_status,
            address=body.address or '',
            contact=body.mobile or '',
        )
    elif role == 'official':
        profile = Official(
            user_id=new_user.user_id,
            first_name=body.first_name,
            middle_name=body.middle_name or '',
            last_name=body.last_name,
            gender=body.gender,
            birthday=body.birthday,
            contact=body.mobile or '',
        )
    else:
        profile = Admin(
            user_id=new_user.user_id,
            first_name=body.first_name,
            middle_name=body.middle_name or '',
            last_name=body.last_name,
            gender=body.gender,
            birthday=body.birthday,
            contact=body.mobile or '',
        )

    db.add(profile)
    db.commit()

    db.add(AuditLog(
        user_id=new_user.user_id,
        action_type="account_registered",
        target_table="tbl_users",
        target_id=new_user.user_id,
        description="Account registered",
        ip_address=getattr(request.state, "client_ip", None),
    ))
    db.commit()

    return {"message": "Registration successful.", "user_id": new_user.user_id}


@router.get("/me", response_model=UserResponse)
def get_current_user_profile(current_user: User = Depends(get_current_user)):
    return current_user


@router.post("/upload-profile-pic")
def upload_profile_pic(
    file: UploadFile = File(...),
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user)
):
    try:
        ext = os.path.splitext(file.filename)[1]
        filename = f"{uuid.uuid4().hex}{ext}"
        filepath = os.path.join(UPLOAD_DIR, filename)
        
        with open(filepath, "wb") as buffer:
            buffer.write(file.file.read())
            
        current_user.profile_pic = f"/uploads/profiles/{filename}"
        db.commit()
        db.refresh(current_user)
        
        return {"message": "Profile picture updated successfully", "profile_pic": current_user.profile_pic}
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Upload failed: {str(e)}")


@router.put("/profile", response_model=UserResponse)
def update_profile(
    body: ProfileUpdate,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user)
):
    if body.username and body.username != current_user.username:
        existing = db.query(User).filter(User.username == body.username).first()
        if existing:
            raise HTTPException(status_code=400, detail="Username already taken")
        current_user.username = body.username

    if body.email is not None:
        current_user.email = body.email

    # Update profile table fields based on role
    profile = None
    role = (current_user.roles or "").strip().lower()
    if role == "super_admin":
        profile = current_user.admin_profile
    elif role == "official":
        profile = current_user.official_profile
    elif role == "resident":
        profile = current_user.resident_profile

    if profile:
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
    return current_user


@router.post("/change-password")
def change_password(
    body: ChangePasswordRequest,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user)
):
    if not verify_password(body.current_password, current_user.password):
        raise HTTPException(status_code=400, detail="Current password is incorrect.")

    current_user.password = hash_password(body.new_password)
    db.commit()
    return {"message": "Password changed successfully."}


@router.post("/forgot-password")
def forgot_password(body: ForgotPasswordRequest, db: Session = Depends(get_db)):
    user = db.query(User).filter(User.email == body.email).first()
    if not user:
        raise HTTPException(status_code=404, detail="No account found with that email address.")

    otp = ''.join(random.choices(string.digits, k=6))
    user.reset_otp = otp
    user.otp_expiry = datetime.now(timezone.utc) + timedelta(minutes=10)
    db.commit()

    send_otp_email(body.email, otp)

    return {"message": "Verification code sent to your email."}


@router.post("/verify-otp")
def verify_otp(body: VerifyOtpRequest, db: Session = Depends(get_db)):
    user = db.query(User).filter(User.email == body.email).first()
    if not user:
        raise HTTPException(status_code=404, detail="No account found with that email address.")

    if not user.reset_otp or user.reset_otp != body.otp:
        raise HTTPException(status_code=400, detail="Invalid verification code.")

    if user.otp_expiry and user.otp_expiry.replace(tzinfo=timezone.utc) < datetime.now(timezone.utc):
        raise HTTPException(status_code=400, detail="Verification code has expired.")

    return {"message": "Verification code confirmed."}


@router.post("/reset-password")
def reset_password(body: ResetPasswordRequest, db: Session = Depends(get_db)):
    user = db.query(User).filter(User.email == body.email).first()
    if not user:
        raise HTTPException(status_code=404, detail="No account found with that email address.")

    if not user.reset_otp or user.reset_otp != body.otp:
        raise HTTPException(status_code=400, detail="Invalid verification code.")

    if user.otp_expiry and user.otp_expiry.replace(tzinfo=timezone.utc) < datetime.now(timezone.utc):
        raise HTTPException(status_code=400, detail="Verification code has expired.")

    user.password = hash_password(body.new_password)
    user.reset_otp = None
    user.otp_expiry = None
    db.commit()

    return {"message": "Password has been reset successfully."}