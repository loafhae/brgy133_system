import os, uuid
from fastapi import APIRouter, Depends, HTTPException, status, UploadFile, File
from sqlalchemy.orm import Session
from app.database import get_db
from app.schemas.auth import LoginRequest, TokenResponse, ChangePasswordRequest, ProfileUpdate
from app.services.auth_service import verify_password, hash_password, create_access_token
from app.dependencies import get_current_user
from app.models.user import User
from app.config import settings
from app.paths import PROFILE_PIC_DIR

router = APIRouter(prefix="/api/auth", tags=["auth"])


def _pic_url(user: User) -> str | None:
    if user.profile_pic:
        return f"/uploads/profile_pics/{user.profile_pic}"
    return None


@router.post("/login")
def login(body: LoginRequest, db: Session = Depends(get_db)):
    user = db.query(User).filter(User.username == body.username).first()
    if not user or not verify_password(body.password, user.password):
        raise HTTPException(status_code=401, detail="Invalid username or password")

    token = create_access_token(data={"sub": str(user.user_id), "role": user.roles})

    return {
        "access_token": token,
        "token_type": "bearer",
        "user": {
            "user_id": user.user_id,
            "username": user.username,
            "roles": user.roles,
            "is_active": user.is_active if hasattr(user, 'is_active') else True,
            "must_change_password": False,
            "profile_pic": _pic_url(user),
        }
    }


@router.post("/change-password")
def change_password(
    body: ChangePasswordRequest,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user),
):
    if not verify_password(body.current_password, current_user.password):
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="Current password is incorrect",
        )
    if len(body.new_password) < 6:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="New password must be at least 6 characters",
        )
    current_user.password = hash_password(body.new_password)
    db.commit()
    return {"detail": "Password changed successfully"}


def _profile_data(user: User):
    profile = None
    if user.roles == "super_admin" and user.admin_profile:
        p = user.admin_profile
        profile = {"first_name": p.first_name, "last_name": p.last_name, "middle_name": p.middle_name, "contact": p.contact}
    elif user.roles == "official" and user.official_profile:
        p = user.official_profile
        profile = {"first_name": p.first_name, "last_name": p.last_name, "middle_name": p.middle_name, "contact": p.contact}
    elif user.roles == "resident" and user.resident_profile:
        p = user.resident_profile
        profile = {"first_name": p.first_name, "last_name": p.last_name, "middle_name": p.middle_name, "contact": p.contact}
    return profile


@router.get("/me")
def get_me(current_user: User = Depends(get_current_user)):
    return {
        "user_id": current_user.user_id,
        "username": current_user.username,
        "role": current_user.roles,
        "is_active": current_user.is_active if hasattr(current_user, 'is_active') else True,
        "must_change_password": False,
        "profile_pic": _pic_url(current_user),
        "profile": _profile_data(current_user),
    }


@router.post("/upload-profile-pic")
async def upload_profile_pic(
    file: UploadFile = File(...),
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db),
):
    if not file.content_type or not file.content_type.startswith("image/"):
        raise HTTPException(status_code=400, detail="File must be an image")

    ext = os.path.splitext(file.filename)[1] if file.filename else ".jpg"
    filename = f"user_{current_user.user_id}_{uuid.uuid4().hex}{ext}"
    filepath = PROFILE_PIC_DIR / filename

    content = await file.read()
    with open(filepath, "wb") as f:
        f.write(content)

    current_user.profile_pic = filename
    db.commit()

    return {"profile_pic": f"/uploads/profile_pics/{filename}"}


@router.put("/profile")
def update_profile(
    body: ProfileUpdate,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user),
):
    if body.username is not None and body.username != current_user.username:
        existing = db.query(User).filter(User.username == body.username, User.user_id != current_user.user_id).first()
        if existing:
            raise HTTPException(status_code=400, detail="Username already taken")
        current_user.username = body.username

    profile = None
    if current_user.roles == "super_admin":
        profile = current_user.admin_profile
    elif current_user.roles == "official":
        profile = current_user.official_profile
    elif current_user.roles == "resident":
        profile = current_user.resident_profile

    if profile:
        if body.first_name is not None:
            profile.first_name = body.first_name
        if body.last_name is not None:
            profile.last_name = body.last_name
        if body.middle_name is not None:
            profile.middle_name = body.middle_name
        if body.contact is not None:
            profile.contact = body.contact

    db.commit()
    db.refresh(current_user)
    return {
        "user_id": current_user.user_id,
        "username": current_user.username,
        "role": current_user.roles,
        "profile_pic": _pic_url(current_user),
        "profile": _profile_data(current_user),
    }