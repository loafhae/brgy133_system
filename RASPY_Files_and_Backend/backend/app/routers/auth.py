import logging
import os
import secrets
import uuid
import hashlib
import hmac
from datetime import datetime, timedelta, timezone
from typing import Optional
from fastapi import APIRouter, Depends, HTTPException, Request, Response, status, UploadFile, File
from sqlalchemy import func
from sqlalchemy.exc import SQLAlchemyError
from sqlalchemy.orm import Session

from app.database import get_db
from app.models.user import User
from app.models.user_session import UserSession, SessionMfaChallenge
from app.schemas.auth import Token, LoginRequest, UserResponse, ProfileUpdate, ChangePasswordRequest, ForgotPasswordRequest, VerifyOtpRequest, ResetPasswordRequest, RegisterRequest, MfaVerifyRequest
from app.models.user import Admin, Official, Resident
from app.models.audit import AuditLog
from app.services.auth_service import verify_password, hash_password, create_access_token
from app.services.email_service import send_otp_email, send_mfa_otp_email
from app.services.resident_data import get_or_create_address
from app.dependencies import get_current_user, require_step_up, session_cookie_name
from app.config import settings

router = APIRouter(prefix="/auth", tags=["auth"])
logger = logging.getLogger(__name__)

UPLOAD_DIR = "uploads/profiles"
os.makedirs(UPLOAD_DIR, exist_ok=True)


def _get_recovery_user(email: str, db: Session) -> User:
    normalized_email = email.strip().lower()
    user = db.query(User).filter(
        func.lower(func.trim(User.email)) == normalized_email
    ).first()
    if not user:
        raise HTTPException(status_code=404, detail="No account found with that email address.")
    return user


def _mfa_code_digest(session_id: str, otp: str) -> str:
    return hmac.new(
        settings.SECRET_KEY.encode("utf-8"),
        f"{session_id}:{otp}".encode("utf-8"),
        hashlib.sha256,
    ).hexdigest()


def _session_audit(db: Session, user: User, action: str, request: Request, description: str) -> None:
    db.add(AuditLog(
        user_id=user.user_id,
        action_type=action,
        target_table="tbl_user_sessions",
        target_id=None,
        description=description,
        ip_address=getattr(request.state, "client_ip", None),
    ))


@router.post("/login", response_model=Token)
def login(
    payload: LoginRequest,
    request: Request,
    response: Response,
    db: Session = Depends(get_db)
):
    request.state.audit_attempted_username = payload.username
    user = db.query(User).filter(User.username == payload.username).first()
    if not user or not verify_password(payload.password, user.password):
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="Incorrect username or password",
        )
    
    if not user.is_active:
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="Account is deactivated. Please contact the administrator."
        )

    if not user.is_approved:
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail="Account is pending approval by administrator."
        )

    if payload.required_role:
        user_roles = [r.strip().lower() for r in (user.roles or "").split(",") if r.strip()]
        req_role = payload.required_role.strip().lower()
        if req_role == "super_admin" and "super_admin" not in user_roles:
            raise HTTPException(
                status_code=status.HTTP_403_FORBIDDEN,
                detail="Access Denied: This portal requires Administrator privileges."
            )
        elif req_role == "official" and not any(r in ("official", "super_admin") for r in user_roles):
            raise HTTPException(
                status_code=status.HTTP_403_FORBIDDEN,
                detail="Access Denied: This portal is for Barangay Officials only."
            )

    access_token_expires = timedelta(minutes=settings.SESSION_ABSOLUTE_TIMEOUT_MINUTES)
    session_id = str(uuid.uuid4())
    now = datetime.now(timezone.utc).replace(tzinfo=None)
    access_token = create_access_token(
        data={"sub": user.username, "roles": user.roles, "sid": session_id},
        expires_in=access_token_expires,
    )
    db.add(UserSession(
        id=session_id,
        user_id=user.user_id,
        created_at=now,
        last_activity_at=now,
    ))
    try:
        db.commit()
    except SQLAlchemyError:
        db.rollback()
        logger.exception("Could not create login session for user_id=%s", user.user_id)
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail="Could not start a secure session. Please try again.",
        )

    response.set_cookie(
        key=session_cookie_name(),
        value=access_token,
        max_age=settings.SESSION_ABSOLUTE_TIMEOUT_MINUTES * 60,
        httponly=True,
        secure=settings.SESSION_COOKIE_SECURE,
        samesite="lax",
        path="/",
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
    is_web_client = request.headers.get("x-session-client") == "web"
    return {
        "access_token": None if is_web_client else access_token,
        "token_type": "cookie" if is_web_client else "bearer",
        "role": user.roles,
        "roles": user.roles,
        "idle_timeout_minutes": settings.IDLE_TIMEOUT_MINUTES,
        "absolute_timeout_minutes": settings.SESSION_ABSOLUTE_TIMEOUT_MINUTES,
    }


@router.post("/logout")
def logout(
    request: Request,
    response: Response,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user),
):
    session_id = getattr(request.state, "session_id", None)
    user_session = db.query(UserSession).filter(
        UserSession.id == session_id,
        UserSession.user_id == current_user.user_id,
    ).first()
    if user_session is not None:
        user_session.revoked_at = datetime.now(timezone.utc).replace(tzinfo=None)
        _session_audit(db, current_user, "session_logout", request, "User signed out.")
        db.commit()

    response.delete_cookie(
        key=session_cookie_name(),
        httponly=True,
        secure=settings.SESSION_COOKIE_SECURE,
        samesite="lax",
        path="/",
    )
    return {"message": "Logged out successfully."}

@router.post("/activity")
def record_activity(current_user: User = Depends(get_current_user)):
    return {"message": "Session activity recorded."}


@router.post("/mfa/challenge")
def create_mfa_challenge(
    request: Request,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user),
):
    if not current_user.email:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="Add an email address to your account before using email verification.",
        )

    session_id = request.state.session_id
    now = datetime.now(timezone.utc).replace(tzinfo=None)
    challenge = db.query(SessionMfaChallenge).filter(
        SessionMfaChallenge.session_id == session_id,
    ).first()
    if challenge and challenge.issued_at > now - timedelta(seconds=60):
        raise HTTPException(
            status_code=status.HTTP_429_TOO_MANY_REQUESTS,
            detail="Please wait before requesting another verification code.",
        )

    otp = f"{secrets.randbelow(1_000_000):06d}"
    if not send_mfa_otp_email(current_user.email, otp):
        raise HTTPException(
            status_code=status.HTTP_503_SERVICE_UNAVAILABLE,
            detail="Unable to send the verification code. Please try again later.",
        )

    if challenge is None:
        challenge = SessionMfaChallenge(session_id=session_id)
        db.add(challenge)
    challenge.code_hash = _mfa_code_digest(session_id, otp)
    challenge.issued_at = now
    challenge.expires_at = now + timedelta(minutes=5)
    challenge.failed_attempts = 0
    challenge.verified_at = None
    _session_audit(db, current_user, "mfa_challenge_sent", request, "Sensitive-action verification code sent.")
    db.commit()
    return {"message": "Verification code sent to the email address on your account."}


@router.post("/mfa/verify")
def verify_mfa_challenge(
    payload: MfaVerifyRequest,
    request: Request,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user),
):
    session_id = request.state.session_id
    challenge = db.query(SessionMfaChallenge).filter(
        SessionMfaChallenge.session_id == session_id,
    ).first()
    now = datetime.now(timezone.utc).replace(tzinfo=None)
    if challenge is None or challenge.expires_at <= now or not challenge.code_hash:
        raise HTTPException(status_code=400, detail="Verification code has expired. Request a new code.")
    if challenge.failed_attempts >= 5:
        raise HTTPException(status_code=429, detail="Too many incorrect codes. Request a new code.")
    if not hmac.compare_digest(challenge.code_hash, _mfa_code_digest(session_id, payload.otp)):
        challenge.failed_attempts += 1
        db.commit()
        raise HTTPException(status_code=400, detail="Verification code is incorrect.")

    challenge.code_hash = ""
    challenge.verified_at = now
    _session_audit(db, current_user, "mfa_verified", request, "Sensitive-action verification succeeded.")
    db.commit()
    return {"message": "Verification successful."}


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

    raw_role = (body.roles or 'resident').strip().lower()

    if raw_role in ('super_admin', 'admin'):
        # Administrators can create their own account
        role = 'super_admin'
        is_approved = 1
    elif raw_role == 'official':
        # Barangay Officials must be registered directly by the Barangay Administrator
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail="Barangay Official accounts cannot self-register publicly. Official accounts must be created directly by the Barangay Administrator in the Admin Portal."
        )
    else:
        # Residents registering themselves must provide Data Privacy Consent (RA 10173)
        role = 'resident'
        if not body.privacy_consent:
            raise HTTPException(
                status_code=status.HTTP_400_BAD_REQUEST,
                detail="You must accept and consent to the Data Privacy Notice pursuant to Republic Act No. 10173 to create a resident account."
            )
        is_approved = 1

    birthday_parsed = None
    if body.birthday and str(body.birthday).strip():
        b_str = str(body.birthday).strip()[:10]
        try:
            birthday_parsed = datetime.strptime(b_str, "%Y-%m-%d").date()
        except Exception:
            birthday_parsed = None

    gender_clean = body.gender.strip()[:100] if body.gender and body.gender.strip() else None
    civil_status_clean = body.civil_status.strip() if body.civil_status and body.civil_status.strip() in ("Single", "Married", "Widowed", "Separated") else None
    contact_clean = body.mobile

    try:
        new_user = User(
            username=body.username.strip(),
            email=body.email.strip() if body.email else None,
            password=hash_password(body.password),
            roles=role,
            is_approved=is_approved,
        )
        db.add(new_user)
        db.flush()

        # Create profile based on role
        if role == 'resident':
            profile = Resident(
                user_id=new_user.user_id,
                first_name=body.first_name.strip(),
                middle_name=(body.middle_name or '').strip(),
                last_name=body.last_name.strip(),
                gender=gender_clean,
                birthday=birthday_parsed,
                civil_status=civil_status_clean,
                address_record=get_or_create_address(db, body.address),
                contact=contact_clean,
            )
        elif role == 'official':
            profile = Official(
                user_id=new_user.user_id,
                first_name=body.first_name.strip(),
                middle_name=(body.middle_name or '').strip(),
                last_name=body.last_name.strip(),
                gender=gender_clean,
                birthday=birthday_parsed,
                contact=contact_clean,
            )
        else:
            profile = Admin(
                user_id=new_user.user_id,
                first_name=body.first_name.strip(),
                middle_name=(body.middle_name or '').strip(),
                last_name=body.last_name.strip(),
                gender=gender_clean,
                birthday=birthday_parsed,
                contact=contact_clean,
            )

        db.add(profile)
        db.flush()

        db.add(AuditLog(
            user_id=new_user.user_id,
            action_type="account_registered",
            target_table="tbl_users",
            target_id=new_user.user_id,
            description=f"Account registered ({role})",
            ip_address=getattr(request.state, "client_ip", None),
        ))
        db.commit()
    except SQLAlchemyError as err:
        db.rollback()
        logger.exception("Database error during registration for user '%s': %s", body.username, str(err))
        raise HTTPException(status_code=500, detail="Database registration failed. Please verify your details.")
    except Exception as e:
        db.rollback()
        logger.exception("Unexpected error during registration for user '%s': %s", body.username, str(e))
        raise HTTPException(status_code=500, detail="An unexpected error occurred during registration.")

    return {"message": "Registration successful.", "user_id": new_user.user_id}


@router.get("/me", response_model=UserResponse)
def get_current_user_profile(current_user: User = Depends(get_current_user)):
    profile = (
        current_user.admin_profile
        or current_user.official_profile
        or current_user.resident_profile
    )
    return {
        "user_id": current_user.user_id,
        "username": current_user.username,
        "email": current_user.email,
        "roles": current_user.roles,
        "role": current_user.roles,
        "profile_pic": current_user.profile_pic,
        "is_approved": current_user.is_approved,
        "first_name": profile.first_name if profile else None,
        "middle_name": profile.middle_name if profile else None,
        "last_name": profile.last_name if profile else None,
        "birthday": profile.birthday if profile else None,
        "gender": profile.gender if profile else None,
        "address": profile.address if isinstance(profile, Resident) else None,
        "contact": profile.contact if profile else None,
        "civil_status": profile.civil_status if isinstance(profile, Resident) else None,
    }


@router.post("/upload-profile-pic")
def upload_profile_pic(
    file: UploadFile = File(...),
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user)
):
    try:
        ext = os.path.splitext(file.filename or "")[1].lower()
        if ext not in [".jpg", ".jpeg", ".png", ".webp"]:
            raise HTTPException(status_code=400, detail="Only JPG, PNG, and WebP image formats are allowed.")
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
    current_user: User = Depends(require_step_up)
):
    if body.username and body.username != current_user.username:
        existing = db.query(User).filter(User.username == body.username).first()
        if existing:
            raise HTTPException(status_code=400, detail="Username already taken")
        current_user.username = body.username

    if body.email is not None:
        email = body.email.strip() or None
        if email and db.query(User).filter(
            func.lower(User.email) == email.lower(),
            User.user_id != current_user.user_id,
        ).first():
            raise HTTPException(status_code=400, detail="Email already in use")
        current_user.email = email

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
        if "birthday" in body.model_fields_set:
            profile.birthday = body.birthday
        if "gender" in body.model_fields_set:
            profile.gender = (
                body.gender.strip()[:100]
                if body.gender and body.gender.strip()
                else None
            )
        if isinstance(profile, Resident):
            if "address" in body.model_fields_set:
                profile.address_record = get_or_create_address(db, body.address)
            if "civil_status" in body.model_fields_set:
                profile.civil_status = (
                    body.civil_status.strip()
                    if body.civil_status and body.civil_status.strip()
                    else None
                )

    db.commit()
    db.refresh(current_user)
    return get_current_user_profile(current_user)


@router.post("/change-password")
def change_password(
    body: ChangePasswordRequest,
    db: Session = Depends(get_db),
    current_user: User = Depends(require_step_up)
):
    if not verify_password(body.current_password, current_user.password):
        raise HTTPException(status_code=400, detail="Current password is incorrect.")

    current_user.password = hash_password(body.new_password)
    db.commit()
    return {"message": "Password changed successfully."}


@router.post("/forgot-password")
def forgot_password(body: ForgotPasswordRequest, db: Session = Depends(get_db)):
    user = _get_recovery_user(body.email, db)

    otp = f"{secrets.randbelow(1_000_000):06d}"
    if not send_otp_email(user.email, otp):
        raise HTTPException(
            status_code=status.HTTP_503_SERVICE_UNAVAILABLE,
            detail="Unable to send the verification code. Please try again later.",
        )

    user.reset_otp = otp
    user.otp_expiry = datetime.now(timezone.utc) + timedelta(minutes=10)
    db.commit()

    return {"message": "Verification code sent to your email."}


def _validate_reset_otp(user: User, otp: str) -> None:
    if (
        not user.reset_otp
        or len(otp) != 6
        or not otp.isascii()
        or not otp.isdigit()
        or not secrets.compare_digest(user.reset_otp, otp)
    ):
        raise HTTPException(status_code=400, detail="Invalid verification code.")

    if not user.otp_expiry:
        raise HTTPException(status_code=400, detail="Verification code has expired.")

    expiry = user.otp_expiry
    if expiry.tzinfo is None:
        expiry = expiry.replace(tzinfo=timezone.utc)
    if expiry <= datetime.now(timezone.utc):
        raise HTTPException(status_code=400, detail="Verification code has expired.")


@router.post("/verify-otp")
def verify_otp(body: VerifyOtpRequest, db: Session = Depends(get_db)):
    user = _get_recovery_user(body.email, db)

    _validate_reset_otp(user, body.otp)

    return {"message": "Verification code confirmed."}


@router.post("/reset-password")
def reset_password(body: ResetPasswordRequest, db: Session = Depends(get_db)):
    user = _get_recovery_user(body.email, db)

    _validate_reset_otp(user, body.otp)

    user.password = hash_password(body.new_password)
    user.reset_otp = None
    user.otp_expiry = None
    db.commit()

    return {"message": "Password has been reset successfully."}