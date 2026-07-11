from datetime import datetime, timedelta
from sqlalchemy.orm import Session
from app.models.detection import DetectionLog, Notification
from app.models.settings import SystemSetting


def get_cooldown_seconds(db: Session) -> int:
    setting = db.query(SystemSetting).filter(
        SystemSetting.config_key == "notification_cooldown"
    ).first()
    return int(setting.config_value) if setting else 300


def should_send_notification(db: Session) -> bool:
    cooldown = get_cooldown_seconds(db)
    last_sent = (
        db.query(Notification)
        .filter(Notification.status == "sent")
        .order_by(Notification.sent_at.desc())
        .first()
    )
    if not last_sent or not last_sent.sent_at:
        return True
    elapsed = datetime.now() - last_sent.sent_at
    return elapsed > timedelta(seconds=cooldown)


def create_detection_notification(db: Session, detection_log: DetectionLog) -> Notification | None:
    if not should_send_notification(db):
        return None

    notification = Notification(
        log_id=detection_log.log_id,
        notification_type="detection",
        title="Garbage Truck Detected",
        message=f"Garbage truck detected in {detection_log.camera_name} area.",
        status="pending",
        target_group="all_residents",
    )
    db.add(notification)
    db.commit()
    db.refresh(notification)
    return notification


def create_announcement_notification(db: Session, announcement_id: int, title: str) -> Notification:
    notification = Notification(
        notification_type="announcement",
        title="New Announcement",
        message=f"New announcement: {title}",
        status="pending",
        target_group="all_residents",
    )
    db.add(notification)
    db.commit()
    db.refresh(notification)
    return notification
