import logging
from fastapi import APIRouter, Depends, HTTPException, status
from sqlalchemy.orm import Session
from sqlalchemy.exc import SQLAlchemyError
from app.database import get_db
from app.dependencies import require_role, require_step_up
from app.models.user import User, Official, Admin, Resident
from app.models.audit import AuditLog
from app.services.auth_service import hash_password
from app.services.phone import normalize_philippine_mobile

router = APIRouter(prefix="/users", tags=["Users"])
logger = logging.getLogger(__name__)

from typing import Optional

@router.get("")
def get_users(
    search: Optional[str] = None,
    role: Optional[str] = None,
    db: Session = Depends(get_db),
    current_user: User = Depends(require_role("super_admin"))
):
    query = db.query(User)
    if role:
        query = query.filter(User.roles.ilike(f"%{role}%"))
    if search:
        query = query.filter(
            (User.username.ilike(f"%{search}%")) |
            (User.email.ilike(f"%{search}%"))
        )
    users = query.all()
    result = []
    for u in users:
        first_name = ""
        last_name = ""
        contact = ""
        if u.admin_profile:
            first_name = u.admin_profile.first_name or ""
            last_name = u.admin_profile.last_name or ""
            contact = u.admin_profile.contact or ""
        elif u.official_profile:
            first_name = u.official_profile.first_name or ""
            last_name = u.official_profile.last_name or ""
            contact = u.official_profile.contact or ""
        elif u.resident_profile:
            first_name = u.resident_profile.first_name or ""
            last_name = u.resident_profile.last_name or ""
            contact = u.resident_profile.contact or ""

        result.append({
            "user_id": u.user_id,
            "username": u.username,
            "email": u.email,
            "roles": u.roles,
            "role": u.roles,
            "is_active": u.is_active,
            "is_approved": u.is_approved,
            "first_name": first_name,
            "last_name": last_name,
            "contact": contact,
            "created_at": u.created_at.isoformat() if u.created_at else None,
        })
    return result

@router.post("", status_code=status.HTTP_201_CREATED)
def create_user(
    body: dict,
    db: Session = Depends(get_db),
    current_user: User = Depends(require_role("super_admin")),
    _mfa_user: User = Depends(require_step_up),
):
    username = (body.get("username") or "").strip()
    if not username:
        raise HTTPException(status_code=400, detail="Username is required.")
    
    password = body.get("password") or ""
    if not password:
        raise HTTPException(status_code=400, detail="Password is required.")

    email = (body.get("email") or "").strip() or None

    # Check duplicate username
    if db.query(User).filter(User.username == username).first():
        raise HTTPException(status_code=400, detail=f"Username '{username}' is already taken.")

    # Check duplicate email
    if email and db.query(User).filter(User.email == email).first():
        raise HTTPException(status_code=400, detail=f"Email '{email}' is already registered.")

    roles_input = body.get("roles", ["official"])
    if isinstance(roles_input, list):
        roles_str = ",".join([str(r).strip() for r in roles_input if str(r).strip()])
    else:
        roles_str = str(roles_input).strip()
    
    primary_role = roles_str.split(",")[0].strip().lower() if roles_str else "official"

    first_name = (body.get("first_name") or username).strip()
    last_name = (body.get("last_name") or "Official").strip()
    contact = (body.get("contact") or "").strip()
    if "resident" in primary_role:
        try:
            contact = normalize_philippine_mobile(contact)
        except ValueError as exc:
            raise HTTPException(status_code=422, detail=str(exc)) from exc

    try:
        new_user = User(
            username=username,
            email=email,
            password=hash_password(password),
            roles=roles_str,
            is_active=body.get("is_active", True),
            is_approved=1  # Admin-created users are automatically approved
        )
        db.add(new_user)
        db.flush()

        # Create appropriate profile
        if "super_admin" in primary_role or "admin" in primary_role:
            profile = Admin(
                user_id=new_user.user_id,
                first_name=first_name,
                last_name=last_name,
                contact=contact
            )
            db.add(profile)
        elif "official" in primary_role:
            profile = Official(
                user_id=new_user.user_id,
                first_name=first_name,
                last_name=last_name,
                contact=contact
            )
            db.add(profile)
        elif "resident" in primary_role:
            profile = Resident(
                user_id=new_user.user_id,
                first_name=first_name,
                last_name=last_name,
                contact=contact,
            )
            db.add(profile)

        db.add(AuditLog(
            user_id=current_user.user_id,
            action_type="admin_create_user",
            target_table="tbl_users",
            target_id=new_user.user_id,
            description="A new user account was created by an administrator."
        ))
        db.commit()
        return {
            "message": "User created successfully.",
            "user_id": new_user.user_id,
            "username": new_user.username,
            "roles": new_user.roles,
            "role": new_user.roles,
        }
    except SQLAlchemyError as e:
        db.rollback()
        logger.exception("Failed to create user: %s", str(e))
        raise HTTPException(status_code=500, detail="Database error creating user.")

@router.put("/{user_id}")
def update_user(
    user_id: int,
    body: dict,
    db: Session = Depends(get_db),
    current_user: User = Depends(require_role("super_admin")),
    _mfa_user: User = Depends(require_step_up),
):
    user = db.query(User).filter(User.user_id == user_id).first()
    if not user:
        raise HTTPException(status_code=404, detail="User not found")
    
    if "username" in body and body["username"]:
        new_u = body["username"].strip()
        if new_u != user.username:
            if db.query(User).filter(User.username == new_u).first():
                raise HTTPException(status_code=400, detail="Username already in use.")
            user.username = new_u

    if "email" in body:
        new_e = (body["email"] or "").strip() or None
        if new_e != user.email:
            if new_e and db.query(User).filter(User.email == new_e).first():
                raise HTTPException(status_code=400, detail="Email already in use.")
            user.email = new_e

    if "roles" in body:
        incoming = body["roles"]
        if isinstance(incoming, list):
            user.roles = ",".join([str(r).strip() for r in incoming if str(r).strip()])
        else:
            user.roles = str(incoming).strip()

    if "is_active" in body:
        user.is_active = bool(body["is_active"])

    if "is_approved" in body:
        user.is_approved = int(body["is_approved"])

    if "password" in body and body["password"] and body["password"].strip() != "":
        user.password = hash_password(body["password"])

    # Update profile name/contact if supplied
    first_name = body.get("first_name")
    last_name = body.get("last_name")
    contact = body.get("contact")

    profile = user.admin_profile or user.official_profile or user.resident_profile
    if profile:
        if first_name is not None:
            profile.first_name = first_name.strip()
        if last_name is not None:
            profile.last_name = last_name.strip()
        if contact is not None:
            if isinstance(profile, Resident):
                try:
                    profile.contact = normalize_philippine_mobile(contact)
                except ValueError as exc:
                    raise HTTPException(status_code=422, detail=str(exc)) from exc
            else:
                profile.contact = contact.strip()

    db.commit()
    db.refresh(user)
    return {
        "message": "User updated successfully.",
        "user_id": user.user_id,
        "username": user.username,
        "roles": user.roles,
        "role": user.roles,
    }

@router.delete("/{user_id}", status_code=status.HTTP_204_NO_CONTENT)
def delete_user(
    user_id: int,
    db: Session = Depends(get_db),
    current_user: User = Depends(require_role("super_admin")),
    _mfa_user: User = Depends(require_step_up),
):
    user = db.query(User).filter(User.user_id == user_id).first()
    if not user:
        raise HTTPException(status_code=404, detail="User not found")
    
    if user.user_id == current_user.user_id:
        raise HTTPException(status_code=400, detail="You cannot delete your own administrative account.")

    db.delete(user)
    db.commit()
    return None