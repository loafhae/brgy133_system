from fastapi import Depends, HTTPException, status
from fastapi.security import HTTPBearer, HTTPAuthorizationCredentials
from sqlalchemy.orm import Session
from app.database import get_db
from app.services.auth_service import decode_access_token
from app.models.user import User

security = HTTPBearer()

def get_current_user(
    credentials: HTTPAuthorizationCredentials = Depends(security),
    db: Session = Depends(get_db),
) -> User:
    token = credentials.credentials
    payload = decode_access_token(token)
    if payload is None:
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="Invalid or expired token",
        )
    sub = payload.get("sub")
    if sub is None:
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="Invalid token payload",
        )
    
    # Safely look up by user_id if numeric, or username if string (e.g. 'admin')
    if str(sub).isdigit():
        user = db.query(User).filter(User.user_id == int(sub)).first()
    else:
        user = db.query(User).filter(User.username == str(sub)).first()

    if user is None:
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="User not found",
        )
    if not user.is_active:
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail="Account is deactivated",
        )
    return user

def require_role(*allowed_roles: str):
    def role_checker(current_user: User = Depends(get_current_user)) -> User:
        # Normalize user roles from comma-separated string or array
        user_roles = []
        if hasattr(current_user, "roles") and current_user.roles:
            user_roles = [r.strip() for r in str(current_user.roles).split(",") if r.strip()]
        elif hasattr(current_user, "role") and current_user.role:
            user_roles = [current_user.role.strip()]
            
        if not any(r in allowed_roles for r in user_roles):
            raise HTTPException(
                status_code=status.HTTP_403_FORBIDDEN,
                detail=f"Roles '{user_roles}' not authorized. Required: {allowed_roles}",
            )
        return current_user
    return role_checker