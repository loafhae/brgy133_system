from fastapi import APIRouter, Depends, HTTPException, status
from sqlalchemy.orm import Session
from app.database import get_db
from app.dependencies import require_role
from app.models.user import User
import bcrypt

router = APIRouter(prefix="/users", tags=["Users"])

def hash_password(password: str) -> str:
    return bcrypt.hashpw(password.encode('utf-8'), bcrypt.gensalt()).decode('utf-8')

@router.get("")
def get_users(db: Session = Depends(get_db), current_user: User = Depends(require_role("super_admin"))):
    return db.query(User).all()

@router.post("")
def create_user(body: dict, db: Session = Depends(get_db), current_user: User = Depends(require_role("super_admin"))):
    hashed_pwd = hash_password(body.get("password", "default123"))
    roles_input = body.get("roles", ["resident"])
    if isinstance(roles_input, list):
        roles_str = ",".join([str(r).strip() for r in roles_input if str(r).strip()])
    else:
        roles_str = str(roles_input).strip()

    new_user = User(
        username=body.get("username"),
        email=body.get("email"),
        password=hashed_pwd,
        roles=roles_str,
        is_active=body.get("is_active", True)
    )
    db.add(new_user)
    db.commit()
    db.refresh(new_user)
    return {"message": "User created successfully.", "user_id": new_user.user_id}

@router.put("/{user_id}")
def update_user(user_id: int, body: dict, db: Session = Depends(get_db), current_user: User = Depends(require_role("super_admin"))):
    user = db.query(User).filter(User.user_id == user_id).first()
    if not user:
        raise HTTPException(status_code=404, detail="User not found")
    
    if "username" in body and body["username"]:
        user.username = body["username"]
    if "email" in body:
        user.email = body["email"]
    if "roles" in body:
        incoming = body["roles"]
        if isinstance(incoming, list):
            user.roles = ",".join([str(r).strip() for r in incoming if str(r).strip()])
        else:
            user.roles = str(incoming).strip()
    if "is_active" in body:
        user.is_active = body["is_active"]
    if "password" in body and body["password"] and body["password"].strip() != "":
        user.password = hash_password(body["password"])

    db.commit()
    db.refresh(user)
    return {"message": "User updated successfully."}

@router.delete("/{user_id}")
def delete_user(user_id: int, db: Session = Depends(get_db), current_user: User = Depends(require_role("super_admin"))):
    user = db.query(User).filter(User.user_id == user_id).first()
    if not user:
        raise HTTPException(status_code=404, detail="User not found")
    db.delete(user)
    db.commit()
    return {"message": "User deleted successfully."}