from datetime import datetime, timezone
import hmac

from fastapi import Depends, Header, HTTPException, Request, status
from fastapi.security import HTTPAuthorizationCredentials, HTTPBearer
from sqlalchemy.orm import Session
from app.config import settings
from app.database import get_db
from app.services.auth_service import decode_access_token
from app.models import AuditLog, SessionMfaChallenge, User, UserSession

security = HTTPBearer(auto_error=False)
_SAFE_METHODS = {"GET", "HEAD", "OPTIONS"}
_STEP_UP_WINDOW_SECONDS = 5 * 60


def is_valid_detector_authorization(authorization: str | None) -> bool:
    if not settings.DETECTOR_API_KEY or not authorization:
        return False
    scheme, separator, token = authorization.partition(" ")
    return (
        bool(separator)
        and scheme.lower() == "bearer"
        and hmac.compare_digest(token, settings.DETECTOR_API_KEY)
    )


def require_detector_key(authorization: str | None = Header(default=None)) -> None:
    if not is_valid_detector_authorization(authorization):
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="Invalid detector API key",
            headers={"WWW-Authenticate": "Bearer"},
        )


def session_cookie_name() -> str:
    return "__Host-visiontrak_session" if settings.SESSION_COOKIE_SECURE else "visiontrak_session"

def get_current_user(
    request: Request,
    credentials: HTTPAuthorizationCredentials | None = Depends(security),
    db: Session = Depends(get_db),
) -> User:
    token = credentials.credentials if credentials else request.cookies.get(session_cookie_name())
    if not token:
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="Authentication required",
            headers={"WWW-Authenticate": "Bearer"},
        )
    if credentials is None and request.method.upper() not in _SAFE_METHODS:
        if request.headers.get("x-session-request") != "1":
            raise HTTPException(
                status_code=status.HTTP_403_FORBIDDEN,
                detail="The session request could not be verified.",
            )

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

    session_id = payload.get("sid")
    if not isinstance(session_id, str):
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="Session is invalid or expired. Please sign in again.",
        )

    user_session = db.query(UserSession).filter(UserSession.id == session_id).first()
    if user_session is None or user_session.revoked_at is not None:
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="Session is invalid or expired. Please sign in again.",
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
    if user_session.user_id != user.user_id:
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="Session is invalid or expired. Please sign in again.",
        )
    if not user.is_active:
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail="Account is deactivated",
        )

    now = datetime.now(timezone.utc).replace(tzinfo=None)
    last_activity_at = user_session.last_activity_at
    if last_activity_at.tzinfo is not None:
        last_activity_at = last_activity_at.astimezone(timezone.utc).replace(tzinfo=None)
    created_at = user_session.created_at
    if created_at.tzinfo is not None:
        created_at = created_at.astimezone(timezone.utc).replace(tzinfo=None)
    expired_reason = None
    if (now - created_at).total_seconds() >= settings.SESSION_ABSOLUTE_TIMEOUT_MINUTES * 60:
        expired_reason = "absolute"
    elif (now - last_activity_at).total_seconds() >= settings.IDLE_TIMEOUT_MINUTES * 60:
        expired_reason = "idle"
    if expired_reason:
        user_session.revoked_at = now
        db.add(AuditLog(
            user_id=user.user_id,
            action_type=f"session_expired_{expired_reason}",
            target_table="tbl_user_sessions",
            target_id=None,
            description=f"Session expired due to {expired_reason} timeout.",
            ip_address=getattr(request.state, "client_ip", None),
        ))
        db.commit()
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail=(
                "Session expired due to inactivity. Please sign in again."
                if expired_reason == "idle"
                else "Session reached its maximum lifetime. Please sign in again."
            ),
        )

    user_session.last_activity_at = now
    db.commit()
    request.state.session_id = session_id
    request.state.auth_method = "bearer" if credentials else "cookie"
    return user


def require_step_up(
    request: Request,
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db),
) -> User:
    session_id = getattr(request.state, "session_id", None)
    challenge = db.query(SessionMfaChallenge).filter(
        SessionMfaChallenge.session_id == session_id,
    ).first()
    verified_at = challenge.verified_at if challenge else None
    now = datetime.now(timezone.utc).replace(tzinfo=None)
    if verified_at is not None and verified_at.tzinfo is not None:
        verified_at = verified_at.astimezone(timezone.utc).replace(tzinfo=None)
    if verified_at is None or (now - verified_at).total_seconds() >= _STEP_UP_WINDOW_SECONDS:
        raise HTTPException(
            status_code=428,
            detail="Email verification is required to complete this sensitive action.",
        )
    return current_user


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