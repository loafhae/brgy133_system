from fastapi import APIRouter, Depends, HTTPException, status, Query
from sqlalchemy.orm import Session
from typing import Optional
from app.database import get_db
from app.dependencies import require_role
from app.models.user import User, Admin, Official, Resident
from app.models.announcement import Announcement
from app.models.feedback import Feedback
from app.schemas.user import UserCreate, UserUpdate, UserResponse
from app.services.auth_service import hash_password

router = APIRouter(prefix="/api/users", tags=["users"])


@router.get("", response_model=list[UserResponse])
def list_users(
    role: Optional[str] = None,
    search: Optional[str] = None,
    page: int = Query(1, ge=1),
    limit: int = Query(20, ge=1, le=100),
    db: Session = Depends(get_db),
    current_user: User = Depends(require_role("super_admin")),
):
    query = db.query(User)
    if role:
        query = query.filter(User.roles == role)
    if search:
        query = query.filter(User.username.ilike(f"%{search}%"))
    users = query.offset((page - 1) * limit).limit(limit).all()
    return users


@router.post("", response_model=UserResponse, status_code=status.HTTP_201_CREATED)
def create_user(
    body: UserCreate,
    db: Session = Depends(get_db),
    current_user: User = Depends(require_role("super_admin")),
):
    existing = db.query(User).filter(User.username == body.username).first()
    if existing:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="Username already exists",
        )
    user = User(
        username=body.username,
        password=hash_password(body.password),
        roles=body.roles,
        must_change_password=True,
    )
    db.add(user)
    db.commit()
    db.refresh(user)
    return user


@router.put("/{user_id}", response_model=UserResponse)
def update_user(
    user_id: int,
    body: UserUpdate,
    db: Session = Depends(get_db),
    current_user: User = Depends(require_role("super_admin")),
):
    user = db.query(User).filter(User.user_id == user_id).first()
    if not user:
        raise HTTPException(status_code=404, detail="User not found")
    if body.username is not None:
        existing = db.query(User).filter(
            User.username == body.username, User.user_id != user_id
        ).first()
        if existing:
            raise HTTPException(status_code=400, detail="Username already taken")
        user.username = body.username
    if body.password is not None:
        user.password = hash_password(body.password)
        user.must_change_password = True
    if body.roles is not None:
        user.roles = body.roles
    if body.is_active is not None:
        user.is_active = body.is_active
    db.commit()
    db.refresh(user)
    return user


@router.delete("/{user_id}", status_code=status.HTTP_204_NO_CONTENT)
def delete_user(
    user_id: int,
    db: Session = Depends(get_db),
    current_user: User = Depends(require_role("super_admin")),
):
    if user_id == current_user.user_id:
        raise HTTPException(status_code=403, detail="Cannot delete your own account")
    user = db.query(User).filter(User.user_id == user_id).first()
    if not user:
        raise HTTPException(status_code=404, detail="User not found")
    if user.roles == "super_admin":
        raise HTTPException(status_code=403, detail="Cannot delete a super admin account")

    # Delete related profile records first to avoid cascade conflicts
    if user.admin_profile:
        db.delete(user.admin_profile)
    if user.official_profile:
        db.delete(user.official_profile)
    if user.resident_profile:
        db.delete(user.resident_profile)

    db.flush()
    db.delete(user)
    db.commit()
    return None
