from datetime import datetime, timezone, timedelta
from typing import Optional
from fastapi import APIRouter, Depends, Query, Response
from sqlalchemy.orm import Session, joinedload
from app.database import get_db
from app.dependencies import require_role, get_current_user
from app.models.user import User
from app.models.audit import AuditLog
from app.models.feedback import Feedback
from app.models.detection import Notification
from app.services.pdf_export import generate_system_logs_pdf

# 🛑 Fixed: Removed redundant "/api"
router = APIRouter(prefix="/activity", tags=["activity"])


def format_role(role_val: Optional[str]) -> str:
    if not role_val:
        return "Resident"
    normalized = role_val.lower()
    if "super_admin" in normalized or normalized == "admin":
        return "Super Admin"
    if "official" in normalized:
        return "Barangay Official"
    return "Resident"


from app.middleware.ip_logger import _friendly_description


def _clean_description(action_type: str, description: Optional[str]) -> str:
    raw = description or ""
    # If description is missing or contains raw technical artifacts, return simple friendly text
    if (
        not raw
        or any(k in raw for k in ["/api/", "HTTP ", "confidence=", "attempted username:", "Cam ", "id=", "ABNORMAL API"])
        or action_type in [
            "truck_present", "truck_departed", "login_failed", "login",
            "session_logout", "admin_create_user", "rate_limit_exceeded"
        ]
    ):
        return _friendly_description(action_type, action_type.endswith("_failed") or "failed" in raw.lower())
    return raw


@router.get("")
def get_my_activity(
    page: int = Query(1, ge=1),
    limit: int = Query(20, ge=1, le=100),
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user),
):
    logs = (
        db.query(AuditLog)
        .filter(AuditLog.user_id == current_user.user_id)
        .order_by(AuditLog.timestamp.desc())
        .offset((page - 1) * limit)
        .limit(limit)
        .all()
    )
    return [
        {
            "log_id": l.log_id,
            "action_type": l.action_type,
            "target_table": l.target_table,
            "target_id": l.target_id,
            "description": _clean_description(l.action_type, l.description),
            "timestamp": str(l.timestamp) if l.timestamp else None,
        }
        for l in logs
    ]


@router.get("/all")
def get_all_activity(
    search: Optional[str] = None,
    activity_type: Optional[str] = None,
    date_from: Optional[str] = None,
    date_to: Optional[str] = None,
    role: Optional[str] = None,
    page: int = Query(1, ge=1),
    limit: int = Query(50, ge=1, le=200),
    db: Session = Depends(get_db),
    current_user: User = Depends(require_role("super_admin", "official")),
):
    query = db.query(AuditLog)
    if activity_type:
        query = query.filter(AuditLog.action_type == activity_type)
    if search:
        query = query.filter(
            AuditLog.description.ilike(f"%{search}%") |
            AuditLog.action_type.ilike(f"%{search}%")
        )
    if date_from:
        query = query.filter(AuditLog.timestamp >= date_from)
    if date_to:
        query = query.filter(AuditLog.timestamp <= date_to)
    if role:
        query = query.join(User, AuditLog.user_id == User.user_id).filter(User.roles.ilike(f"%{role}%"))
    query = query.options(joinedload(AuditLog.user))
    logs = (
        query.order_by(AuditLog.timestamp.desc())
        .offset((page - 1) * limit)
        .limit(limit)
        .all()
    )

    now = datetime.now(timezone.utc)
    active_threshold = timedelta(minutes=2)

    response = []
    for l in logs:
        user = l.user
        is_online = False
        user_role = "Resident"

        if user:
            raw_role = getattr(user, "roles", getattr(user, "role", None))
            user_role = format_role(raw_role)

            last_seen = getattr(user, "last_seen", None)
            if last_seen:
                if not last_seen.tzinfo:
                    last_seen = last_seen.replace(tzinfo=timezone.utc)
                is_online = (now - last_seen) <= active_threshold
        else:
            desc = (l.description or "").lower()
            if "admin" in desc:
                user_role = "Super Admin"
            elif "official" in desc:
                user_role = "Barangay Official"

        response.append(
            {
                "log_id": l.log_id,
                "user_id": l.user_id,
                "username": user.username if user else (
                    f"User #{l.user_id}" if l.user_id is not None else "Unauthenticated"
                ),
                "role": user_role,
                "action_type": l.action_type,
                "target_table": l.target_table,
                "description": _clean_description(l.action_type, l.description),
                "timestamp": str(l.timestamp) if l.timestamp else None,
                "ip_address": l.ip_address if hasattr(l, 'ip_address') else None,
                "is_active": is_online,
            }
        )

    response_data = response
    return response_data


@router.get("/all/export")
def export_system_logs(
    format: str = "pdf",
    search: Optional[str] = None,
    activity_type: Optional[str] = None,
    date_from: Optional[str] = None,
    date_to: Optional[str] = None,
    role: Optional[str] = None,
    db: Session = Depends(get_db),
    current_user: User = Depends(require_role("super_admin")),
):
    # Build query with same filters as get_all_activity
    query = db.query(AuditLog)
    if activity_type:
        query = query.filter(AuditLog.action_type == activity_type)
    if search:
        query = query.filter(
            AuditLog.description.ilike(f"%{search}%") |
            AuditLog.action_type.ilike(f"%{search}%")
        )
    if date_from:
        query = query.filter(AuditLog.timestamp >= date_from)
    if date_to:
        query = query.filter(AuditLog.timestamp <= date_to)
    if role:
        query = query.join(User, AuditLog.user_id == User.user_id).filter(User.roles.ilike(f"%{role}%"))
    query = query.options(joinedload(AuditLog.user))
    logs = query.order_by(AuditLog.timestamp.desc()).all()

    now = datetime.now(timezone.utc)
    active_threshold = timedelta(minutes=2)

    response_logs = []
    for l in logs:
        user = l.user
        is_online = False
        user_role = "Resident"

        if user:
            raw_role = getattr(user, "roles", getattr(user, "role", None))
            user_role = format_role(raw_role)

            last_seen = getattr(user, "last_seen", None)
            if last_seen:
                if not last_seen.tzinfo:
                    last_seen = last_seen.replace(tzinfo=timezone.utc)
                is_online = (now - last_seen) <= active_threshold
        else:
            desc = (l.description or "").lower()
            if "admin" in desc:
                user_role = "Super Admin"
            elif "official" in desc:
                user_role = "Barangay Official"

        response_logs.append(
            {
                "log_id": l.log_id,
                "user_id": l.user_id,
                "username": user.username if user else (
                    f"User #{l.user_id}" if l.user_id is not None else "Unauthenticated"
                ),
                "role": user_role,
                "action_type": l.action_type,
                "target_table": l.target_table,
                "description": _clean_description(l.action_type, l.description),
                "timestamp": str(l.timestamp) if l.timestamp else None,
                "ip_address": l.ip_address if hasattr(l, 'ip_address') else None,
                "is_active": is_online,
            }
        )

    # Prepare filters for PDF header
    filters = {}
    if search:
        filters['search'] = search
    if date_from:
        filters['date_from'] = date_from
    if date_to:
        filters['date_to'] = date_to
    if activity_type:
        filters['action_type'] = activity_type
    if role:
        filters['role'] = role

    # Generate PDF
    pdf_bytes = generate_system_logs_pdf(response_logs, filters)

    return Response(
        content=pdf_bytes,
        media_type="application/pdf",
        headers={
            "Content-Disposition": f'attachment; filename="system-logs-{datetime.now().strftime("%Y-%m-%d")}.pdf"'
        }
    )