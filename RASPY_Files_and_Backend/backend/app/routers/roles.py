from fastapi import APIRouter, Depends, HTTPException, status
from sqlalchemy.orm import Session
from pydantic import BaseModel
from typing import List
from app.database import get_db
from app.dependencies import require_role
from app.models.user import User

router = APIRouter(prefix="/api/roles", tags=["roles"])

class RoleUpdateRequest(BaseModel):
    new_role: str  # e.g. "super_admin", "official", "resident"

@router.put("/users/{user_id}/role")
def update_user_role(
    user_id: int,
    body: RoleUpdateRequest,
    db: Session = Depends(get_db),
    current_user: User = Depends(require_role("super_admin"))
):
    target_user = db.query(User).filter(User.user_id == user_id).first()
    if not target_user:
        raise HTTPException(status_code=404, detail="User not found.")
    
    target_user.roles = body.new_role
    db.commit()
    
    return {
        "message": f"User {target_user.username} role successfully updated to '{body.new_role}'.",
        "user_id": target_user.user_id,
        "roles": target_user.roles
    }