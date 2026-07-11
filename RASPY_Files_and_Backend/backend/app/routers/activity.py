from fastapi import APIRouter, Depends, Query
from sqlalchemy.orm import Session, joinedload
from typing import Optional
from app.database import get_db
from app.dependencies import require_role, get_current_user
from app.models.user import User
from app.models.audit import AuditLog
from app.models.feedback import Feedback
from app.models.detection import Notification

router = APIRouter(prefix="/api/activity", tags=["activity"])


@router.get("")
def get_my_activity(
    page: int = Query(1, ge=1),
    limit: int = Query(20, ge=1, le=100),
    db: Session = Depends(get_db),
    current_user: User = Depends(require_role("resident")),
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
            "description": l.description,
            "timestamp": str(l.timestamp) if l.timestamp else None,
        }
        for l in logs
    ]


@router.get("/all")
def get_all_activity(
    search: Optional[str] = None,
    activity_type: Optional[str] = None,
    page: int = Query(1, ge=1),
    limit: int = Query(50, ge=1, le=200),
    db: Session = Depends(get_db),
    current_user: User = Depends(require_role("super_admin", "official")),
):
    query = db.query(AuditLog)
    if activity_type:
        query = query.filter(AuditLog.action_type == activity_type)
    query = query.options(joinedload(AuditLog.user))
    logs = query.order_by(AuditLog.timestamp.desc()).offset((page - 1) * limit).limit(limit).all()
    return [
        {
            "log_id": l.log_id,
            "user_id": l.user_id,
            "username": l.user.username if l.user else f"User #{l.user_id}",
            "action_type": l.action_type,
            "target_table": l.target_table,
            "description": l.description,
            "timestamp": str(l.timestamp) if l.timestamp else None,
        }
        for l in logs
    ]
