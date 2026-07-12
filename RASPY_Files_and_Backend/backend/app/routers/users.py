from fastapi import APIRouter, Depends, HTTPException, status, Query
from sqlalchemy.orm import Session
from typing import Optional
from app.database import get_db
from app.dependencies import require_role
from app.models.user import User
from app.schemas.user import UserCreate, UserUpdate, UserResponse
from app.services.auth_service import hash_password

# ✅ This is the attribute main.py was looking for!
router = APIRouter(prefix="/api/users", tags=["users"])

@router.get("/", response_model=list[UserResponse])
def list_users(
    role: Optional[str] = None,
    search: Optional[str] = None,
    page: int = Query(1, ge=1),
    limit: int = Query(20, ge=1, le=100),
    db: Session = Depends(get_db),
    current_user: User = Depends(require_role("Super Admin")),
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
    current_user: User = Depends(require_role("Super Admin")),
):
    existing = db.query(User).filter(User.username == body.username).first()
    if existing:
        raise HTTPException(status_code=400, detail="Username already exists")
    user = User(
        username=body.username,
        password=hash_password(body.password),
        roles=body.roles,
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
    current_user: User = Depends(require_role("Super Admin")),
):
    user = db.query(User).filter(User.user_id == user_id).first()
    if not user:
        raise HTTPException(status_code=404, detail="User not found")
    if body.username is not None:
        existing = db.query(User).filter(User.username == body.username, User.user_id != user_id).first()
        if existing:
            raise HTTPException(status_code=400, detail="Username already taken")
        user.username = body.username
    if body.password is not None:
        user.password = hash_password(body.password)
    if body.roles is not None:
        user.roles = body.roles
    db.commit()
    db.refresh(user)
    return user

@router.delete("/{user_id}", status_code=status.HTTP_204_NO_CONTENT)
def delete_user(
    user_id: int,
    db: Session = Depends(get_db),
    current_user: User = Depends(require_role("Super Admin")),
):
    if user_id == current_user.user_id:
        raise HTTPException(status_code=403, detail="Cannot delete your own account")
    user = db.query(User).filter(User.user_id == user_id).first()
    if not user:
        raise HTTPException(status_code=404, detail="User not found")
    if user.roles == "Super Admin":
        raise HTTPException(status_code=403, detail="Cannot delete a super admin account")
    db.delete(user)
    db.commit()
    return None