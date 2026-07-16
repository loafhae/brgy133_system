from fastapi import APIRouter, Depends, HTTPException, status
from sqlalchemy.orm import Session
from app.database import get_db
from app.dependencies import require_role, get_current_user
from app.models.user import User
from app.models.detection import DetectionLog, Notification
from app.models.audit import AuditLog
from app.schemas.detection import (
    DetectionEvent,
    DetectionLogResponse,
    TruckStatusEvent,
    CameraSwitchEvent,
)
from datetime import datetime

router = APIRouter(prefix="/api/detection", tags=["detection"])


@router.post("/event", response_model=DetectionLogResponse)
def receive_detection_event(
    body: DetectionEvent,
    db: Session = Depends(get_db),
):
    log = DetectionLog(
        confidence_score=body.confidence,
        image_path=body.image_path,
        camera_id=body.camera_id,
        camera_name=body.camera_name,
        notification_status="pending",
    )
    db.add(log)
    db.commit()
    db.refresh(log)
    return log


@router.post("/truck-status")
def receive_truck_status(
    body: TruckStatusEvent,
    db: Session = Depends(get_db),
):
    event_type = body.event_type.lower()
    if event_type not in ("truck_present", "truck_departed"):
        raise HTTPException(status_code=400, detail="event_type must be 'truck_present' or 'truck_departed'")

    action_label = "Truck Present" if event_type == "truck_present" else "Truck Departed"

    log = DetectionLog(
        confidence_score=body.confidence or 0.0,
        image_path=body.image_path,
        camera_id=body.camera_id,
        camera_name=body.camera_name,
        notification_status="pending",
    )
    db.add(log)
    db.flush()

    notification = Notification(
        log_id=log.log_id,
        notification_type="detection",
        title=f"{action_label} - {body.camera_name}",
        message=f"Garbage truck {event_type.replace('_', ' ')} at {body.camera_name}",
        status="pending",
        target_group="residents",
    )
    db.add(notification)

    audit = AuditLog(
        user_id=None,
        action_type=event_type,
        target_table="tbl_DetectionLog",
        target_id=log.log_id,
        description=f"{action_label} on {body.camera_name} (confidence={body.confidence})",
    )
    db.add(audit)

    db.commit()
    db.refresh(log)

    return {
        "status": "ok",
        "event_type": event_type,
        "log_id": log.log_id,
        "notification_id": notification.notification_id,
    }


@router.post("/camera-event")
def receive_camera_event(
    body: CameraSwitchEvent,
    db: Session = Depends(get_db),
):
    event_label = body.event_type.replace("_", " ").title()

    audit = AuditLog(
        user_id=None,
        action_type=body.event_type,
        target_table="tbl_DetectionLog",
        target_id=None,
        description=f"{event_label} on {body.camera_name} (id={body.camera_id})",
    )
    db.add(audit)
    db.commit()

    return {"status": "ok", "event_type": body.event_type}


@router.get("/logs", response_model=list[DetectionLogResponse])
def list_detection_logs(
    db: Session = Depends(get_db),
    current_user: User = Depends(require_role("super_admin", "official", "resident")),
):
    logs = db.query(DetectionLog).order_by(DetectionLog.timestamp.desc()).limit(100).all()
    return logs


@router.get("/notifications")
def list_notifications(
    db: Session = Depends(get_db),
    current_user: User = Depends(require_role("resident", "official", "super_admin")),
):
    notifs = (
        db.query(Notification)
        .filter(Notification.target_group == "residents")
        .order_by(Notification.created_at.desc())
        .limit(50)
        .all()
    )
    return [
        {
            "notification_id": n.notification_id,
            "log_id": n.log_id,
            "notification_type": n.notification_type,
            "title": n.title,
            "message": n.message,
            "status": n.status,
            "sent_at": str(n.sent_at) if n.sent_at else None,
            "created_at": str(n.created_at) if n.created_at else None,
        }
        for n in notifs
    ]


@router.get("/status")
def get_detection_status(
    db: Session = Depends(get_db),
):
    latest_notif = (
        db.query(Notification)
        .filter(
            Notification.notification_type == "detection",
            Notification.target_group == "residents",
        )
        .order_by(Notification.created_at.desc())
        .first()
    )

    if not latest_notif:
        return {"status": "no_detections", "last_detection": None}

    cooldown = 300
    try:
        from app.models.settings import SystemSetting
        setting = db.query(SystemSetting).filter(
            SystemSetting.config_key == "notification_cooldown"
        ).first()
        if setting:
            cooldown = int(setting.config_value)
    except Exception:
        pass

    now = datetime.now()
    is_active = False
    if latest_notif.sent_at:
        elapsed = (now - latest_notif.sent_at).total_seconds()
        is_active = elapsed < cooldown

    return {
        "status": "active" if is_active else "idle",
        "last_detection": {
            "title": latest_notif.title,
            "message": latest_notif.message,
            "timestamp": str(latest_notif.sent_at) if latest_notif.sent_at else None,
        },
    }
