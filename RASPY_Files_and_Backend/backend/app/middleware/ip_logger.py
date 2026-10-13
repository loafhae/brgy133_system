import logging
import re
from starlette.middleware.base import BaseHTTPMiddleware
from starlette.requests import Request
from starlette.responses import Response
from app.database import SessionLocal, get_db
from app.models.audit import AuditLog
from app.models.user import User
from app.services.auth_service import decode_access_token

logger = logging.getLogger(__name__)

_IGNORED_WRITE_PATHS = {
    "/api/users/heartbeat",
    "/api/residents/fcm-token",
    "/api/residents/fcm-token/",
}
_EXPLICITLY_AUDITED_PATHS = {
    "/api/auth/login",
    "/api/auth/register",
    "/api/feedback",
    "/api/feedback/with-attachments",
}
_RESOURCE_TABLES = {
    "announcements": "tbl_announcement",
    "feedback": "tbl_feedback",
    "residents": "tbl_residents",
    "users": "tbl_users",
    "roles": "tbl_users",
    "settings": "tbl_SystemSettings",
    "reports": "tbl_reports",
    "backup": "tbl_backup",
}


def _request_action(path: str, method: str, failed: bool) -> tuple[str, str, int | None]:
    segments = [segment for segment in path.strip("/").split("/") if segment]
    resource = segments[1] if len(segments) > 1 and segments[0] == "api" else "api"
    operation = {
        "POST": "create",
        "PUT": "update",
        "PATCH": "update",
        "DELETE": "delete",
    }.get(method, method.lower())

    if resource == "auth":
        route_name = segments[2] if len(segments) > 2 else "request"
        action_names = {
            "change-password": "password_change",
            "forgot-password": "password_recovery",
            "verify-otp": "password_recovery_verification",
            "reset-password": "password_reset",
        }
        action = action_names.get(route_name, f"account_{operation}")
        table = "tbl_users"
    else:
        singular_resource = {
            "announcements": "announcement",
            "feedback": "feedback",
            "residents": "resident",
            "users": "user",
            "roles": "user_role",
            "settings": "setting",
            "reports": "report",
            "backup": "backup",
        }.get(resource, resource.rstrip("s"))
        action = f"{singular_resource}_{operation}"
        table = _RESOURCE_TABLES.get(resource, f"tbl_{resource}")

    if failed:
        action = "login_failed" if path == "/api/auth/login" else f"{action}_failed"
    else:
        success_verb = {
            "POST": "created",
            "PUT": "updated",
            "PATCH": "updated",
            "DELETE": "deleted",
        }.get(method, method.lower())
        if not action.startswith(("password_", "account_")):
            action = f"{action.rsplit('_', 1)[0]}_{success_verb}"

    target_id = next(
        (int(segment) for segment in segments[2:] if re.fullmatch(r"\d+", segment)),
        None,
    )
    return action, table, target_id


def _record_request(request: Request, status_code: int, *, failed: bool) -> None:
    path = request.url.path
    method = request.method.upper()
    token_header = request.headers.get("authorization", "")
    token = token_header[7:].strip() if token_header.lower().startswith("bearer ") else None
    payload = decode_access_token(token) if token else None

    override = request.app.dependency_overrides.get(get_db)
    db_generator = override() if override else None
    db = next(db_generator) if db_generator else SessionLocal()
    try:
        user = None
        if payload:
            subject = payload.get("sub")
            if subject is not None:
                if str(subject).isdigit():
                    user = db.query(User).filter(User.user_id == int(subject)).first()
                else:
                    user = db.query(User).filter(User.username == str(subject)).first()

        action, target_table, target_id = _request_action(path, method, failed)
        description = f"{'Failed' if failed else 'Succeeded'} {method} {path} (HTTP {status_code})"
        attempted_username = getattr(request.state, "audit_attempted_username", None)
        if failed and path == "/api/auth/login" and isinstance(attempted_username, str):
            description += f"; attempted username: {attempted_username[:255]!r}"

        db.add(AuditLog(
            user_id=user.user_id if user else None,
            action_type=action,
            target_table=target_table,
            target_id=target_id,
            description=description,
            ip_address=getattr(request.state, "client_ip", None),
        ))
        db.commit()
    except Exception:
        db.rollback()
        logger.exception("Could not record API activity for %s %s", method, path)
    finally:
        if db_generator:
            db_generator.close()
        else:
            db.close()


class IPLoggerMiddleware(BaseHTTPMiddleware):
    async def dispatch(self, request: Request, call_next):
        # Get client IP from X-Forwarded-For header (Cloudflare) or direct connection
        forwarded_for = request.headers.get("x-forwarded-for")
        if forwarded_for:
            # X-Forwarded-For can contain multiple IPs, take the first one (original client)
            client_ip = forwarded_for.split(",")[0].strip()
        else:
            # Fallback to direct connection IP
            client_ip = request.client.host if request.client else "unknown"

        # Store IP in request state for use in route handlers
        request.state.client_ip = client_ip

        try:
            response = await call_next(request)
        except Exception:
            path = request.url.path
            if path.startswith("/api/"):
                _record_request(request, 500, failed=True)
            raise

        path = request.url.path
        method = request.method.upper()
        is_api_request = path.startswith("/api/")
        is_write = method in {"POST", "PUT", "PATCH", "DELETE"}

        failed_request = is_api_request and response.status_code >= 400
        successful_write = (
            is_api_request
            and is_write
            and path not in _IGNORED_WRITE_PATHS
            and path not in _EXPLICITLY_AUDITED_PATHS
            and request.headers.get("authorization", "").lower().startswith("bearer ")
            and response.status_code < 400
        )

        if failed_request or successful_write:
            _record_request(
                request,
                response.status_code,
                failed=response.status_code >= 400,
            )
        return response