from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy.orm import Session
from typing import List, Optional
from app.database import get_db
from app.models.user import User, Resident
from app.services.auth_service import hash_password

router = APIRouter(prefix="/api/users", tags=["users"])

@router.get("/")
def get_users(db: Session = Depends(get_db)):
    users = db.query(User).all()
    result = []
    for u in users:
        res_profile = db.query(Resident).filter(Resident.user_id == u.user_id).first()
        
        raw_roles = getattr(u, "roles", "resident")
        if isinstance(raw_roles, str):
            roles_list = [r.strip() for r in raw_roles.split(",") if r.strip()]
        else:
            roles_list = raw_roles if isinstance(raw_roles, list) else [str(raw_roles)]

        result.append({
            "user_id": u.user_id,
            "username": u.username,
            "email": u.email if u.email else "",
            "roles": roles_list,
            "is_active": getattr(u, "is_active", True),
            "is_approved": getattr(u, "is_approved", 1),
            "first_name": res_profile.first_name if res_profile else "",
            "last_name": res_profile.last_name if res_profile else "",
        })
    return result

@router.put("/{user_id}/verify")
def verify_user(user_id: int, db: Session = Depends(get_db)):
    user = db.query(User).filter(User.user_id == user_id).first()
    if not user:
        raise HTTPException(status_code=404, detail="User not found")
    
    user.is_approved = 1
    db.commit()
    return {"message": "User successfully verified and approved."}

@router.put("/{user_id}")
def update_user(user_id: int, body: dict, db: Session = Depends(get_db)):
    user = db.query(User).filter(User.user_id == user_id).first()
    if not user:
        raise HTTPException(status_code=404, detail="User not found")
    
    if "username" in body and body["username"]:
        user.username = body["username"]
    if "email" in body:
        user.email = body["email"]
    if "roles" in body:
        incoming_roles = body["roles"]
        if isinstance(incoming_roles, list):
            user.roles = ",".join([str(r).strip() for r in incoming_roles if str(r).strip()])
        else:
            user.roles = str(incoming_roles).strip()
    if "is_active" in body:
        user.is_active = body["is_active"]
    if "is_approved" in body:
        user.is_approved = body["is_approved"]
    if "password" in body and body["password"] and body["password"].strip() != "":
        user.password = hash_password(body["password"])

    db.commit()
    db.refresh(user)
    return {"message": "User updated successfully."}

@router.delete("/{user_id}")
def delete_user(user_id: int, db: Session = Depends(get_db)):
    user = db.query(User).filter(User.user_id == user_id).first()
    if not user:
        raise HTTPException(status_code=404, detail="User not found")
    
    # Automatically clean up and remove the linked resident profile data
    resident = db.query(Resident).filter(Resident.user_id == user_id).first()
    if resident:
        db.delete(resident)
        
    db.delete(user)
    db.commit()
    return {"message": "User and associated resident data successfully deleted."}