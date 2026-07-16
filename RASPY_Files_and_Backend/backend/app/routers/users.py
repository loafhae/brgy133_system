from fastapi import APIRouter, Depends, HTTPException, status, Query
from sqlalchemy.orm import Session, joinedload
from typing import Optional
from app.database import get_db
from app.dependencies import require_role
from app.models.user import User, Resident, Admin, Official
from app.schemas.user import UserCreate, UserUpdate, UserResponse
from app.services.auth_service import hash_password

router = APIRouter(prefix="/api/users", tags=["users"])


def _attach_profile(user: User, response: dict):
    if user.roles == "resident" and user.resident_profile:
        p = user.resident_profile
        response.update(
            first_name=p.first_name, middle_name=p.middle_name,
            last_name=p.last_name, gender=p.gender, birthday=str(p.birthday) if p.birthday else None,
            address=p.address, contact=p.contact, civil_status=p.civil_status, email=p.email,
        )
    elif user.roles == "official" and user.official_profile:
        p = user.official_profile
        response.update(
            first_name=p.first_name, middle_name=p.middle_name,
            last_name=p.last_name, contact=p.contact,
        )
    elif user.roles == "super_admin" and user.admin_profile:
        p = user.admin_profile
        response.update(
            first_name=p.first_name, middle_name=p.middle_name,
            last_name=p.last_name, contact=p.contact,
        )
    return response


@router.get("", response_model=list[UserResponse])
def list_users(
    role: Optional[str] = None,
    search: Optional[str] = None,
    page: int = Query(1, ge=1),
    limit: int = Query(50, ge=1, le=200),
    db: Session = Depends(get_db),
    current_user: User = Depends(require_role("super_admin")),
):
    query = db.query(User).options(
        joinedload(User.resident_profile),
        joinedload(User.official_profile),
        joinedload(User.admin_profile),
    )
    if role:
        query = query.filter(User.roles == role)
    if search:
        query = query.filter(
            User.username.ilike(f"%{search}%")
            | User.roles.ilike(f"%{search}%")
        )
    users = query.order_by(User.user_id).offset((page - 1) * limit).limit(limit).all()
    result = []
    for u in users:
        d = {
            "user_id": u.user_id, "username": u.username, "roles": u.roles,
            "is_active": u.is_active, "created_at": u.created_at, "profile_pic": u.profile_pic,
        }
        result.append(_attach_profile(u, d))
    return result


@router.post("", response_model=UserResponse, status_code=status.HTTP_201_CREATED)
def create_user(
    body: UserCreate,
    db: Session = Depends(get_db),
    current_user: User = Depends(require_role("super_admin")),
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
    db.flush()

    if body.roles == "resident":
        resident = Resident(
            user_id=user.user_id,
            first_name=body.first_name or "",
            middle_name=body.middle_name,
            last_name=body.last_name or "",
            gender=body.gender,
            birthday=body.birthday,
            address=body.address,
            contact=body.contact,
            civil_status=body.civil_status,
            email=body.email,
        )
        db.add(resident)
    elif body.roles == "official":
        official = Official(
            user_id=user.user_id,
            first_name=body.first_name or "",
            middle_name=body.middle_name,
            last_name=body.last_name or "",
            contact=body.contact,
        )
        db.add(official)
    elif body.roles == "super_admin":
        admin = Admin(
            user_id=user.user_id,
            first_name=body.first_name or "",
            middle_name=body.middle_name,
            last_name=body.last_name or "",
            contact=body.contact,
        )
        db.add(admin)

    db.commit()
    db.refresh(user)
    d = {
        "user_id": user.user_id, "username": user.username, "roles": user.roles,
        "is_active": user.is_active, "created_at": user.created_at, "profile_pic": user.profile_pic,
    }
    return _attach_profile(user, d)


@router.put("/{user_id}", response_model=UserResponse)
def update_user(
    user_id: int,
    body: UserUpdate,
    db: Session = Depends(get_db),
    current_user: User = Depends(require_role("super_admin")),
):
    user = db.query(User).options(
        joinedload(User.resident_profile),
        joinedload(User.official_profile),
        joinedload(User.admin_profile),
    ).filter(User.user_id == user_id).first()
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
    if body.is_active is not None:
        user.is_active = body.is_active

    profile = None
    if user.roles == "resident":
        profile = user.resident_profile
    elif user.roles == "official":
        profile = user.official_profile
    elif user.roles == "super_admin":
        profile = user.admin_profile

    if profile:
        for f in ["first_name", "middle_name", "last_name", "gender", "birthday", "address", "contact", "civil_status", "email"]:
            v = getattr(body, f, None)
            if v is not None:
                setattr(profile, f, v)

    db.commit()
    db.refresh(user)
    d = {
        "user_id": user.user_id, "username": user.username, "roles": user.roles,
        "is_active": user.is_active, "created_at": user.created_at, "profile_pic": user.profile_pic,
    }
    return _attach_profile(user, d)


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
    db.delete(user)
    db.commit()
    return None
