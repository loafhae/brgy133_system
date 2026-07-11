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


@router.post("/login", response_model=TokenResponse)
def login(body: LoginRequest, db: Session = Depends(get_db)):
    user = db.query(User).filter(User.username == body.username).first()
    if not user or not verify_password(body.password, user.password):
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="Invalid username or password",
        )
    if not user.is_active:
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail="Account is deactivated",
        )
    token = create_access_token(data={"sub": str(user.user_id), "role": user.roles})
    return TokenResponse(
        access_token=token,
        role=user.roles,
        user_id=user.user_id,
        expires_in=settings.ACCESS_TOKEN_EXPIRE_MINUTES * 60,
        must_change_password=user.must_change_password,
    )


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
    current_user.must_change_password = False
    db.commit()
    return {"detail": "Password changed successfully"}


@router.get("/me")
def get_me(current_user: User = Depends(get_current_user)):
    pic_url = None
    if current_user.profile_pic:
        pic_url = f"/uploads/profile_pics/{current_user.profile_pic}"
    return {
        "user_id": current_user.user_id,
        "username": current_user.username,
        "role": current_user.roles,
        "is_active": current_user.is_active,
        "must_change_password": current_user.must_change_password,
        "profile_pic": pic_url,
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
