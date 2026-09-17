from datetime import datetime
from sqlalchemy.orm import Session
from app.models.audit import AuditLog


def log_action(
    db: Session,
    user_id: int | None,
    action_type: str,
    target_table: str | None = None,
    target_id: int | None = None,
    description: str | None = None,
    ip_address: str | None = None,
):
    entry = AuditLog(
        user_id=user_id,
        action_type=action_type,
        target_table=target_table,
        target_id=target_id,
        description=description,
        ip_address=ip_address,
    )
    db.add(entry)
    db.commit()