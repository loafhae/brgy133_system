import os, uuid
from fastapi import APIRouter, Depends, HTTPException, status, UploadFile, File
from sqlalchemy.orm import Session
from app.database import get_db
from app.schemas.auth import LoginRequest, TokenResponse, ChangePasswordRequest
from app.services.auth_service import verify_password, hash_password, create_access_token
from app.dependencies import get_current_user
from app.models.user import User
from app.config import settings
from app.paths import PROFILE_PIC_DIR

router = APIRouter(prefix="/api/auth", tags=["auth"])


@router.post("/login")
def login(body: LoginRequest, db: Session = Depends(get_db)):
    user = db.query(User).filter(User.username == body.username).first()
    if not user or not verify_password(body.password, user.password):
        raise HTTPException(status_code=401, detail="Invalid username or password")
        
    # Generate token since user exists and password matches perfectly
    token = create_access_token(data={"sub": user.username, "role": user.roles})
    
    # ✅ FIXED: Added safe placeholder fields so the Flutter JSON parser doesn't crash on null keys
    return {
        "access_token": token,
        "token_type": "bearer",
        "user": {
            "user_id": user.user_id,
            "username": user.username,
            "roles": user.roles,
            "is_active": True,                  # 👈 Safe frontend placeholder
            "must_change_password": False,       # 👈 Safe frontend placeholder
            "profile_pic": None                  # 👈 Safe frontend placeholder
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
    # ✅ FIXED: Stripped out must_change_password attribute reference assignment
    db.commit()
    return {"detail": "Password changed successfully"}


@router.get("/me")
def get_me(current_user: User = Depends(get_current_user)):
    return {
        "user_id": current_user.user_id,
        "username": current_user.username,
        "role": current_user.roles,
        "is_active": True,
        "must_change_password": False,
        "profile_pic": None,
    }


# ❌ NOTE: The /upload-profile-pic route was removed because the profile_pic column 
# does not exist within your current physical tbl_users database schema grid setup.