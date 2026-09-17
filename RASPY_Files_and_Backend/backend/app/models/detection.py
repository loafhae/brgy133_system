from sqlalchemy import Column, Integer, String, Float, Enum, DateTime, ForeignKey, Text
from sqlalchemy.orm import relationship
from sqlalchemy.sql import func
from app.database import Base


class DetectionLog(Base):
    __tablename__ = "tbl_DetectionLog"

    log_id = Column(Integer, primary_key=True, autoincrement=True)
    timestamp = Column(DateTime, server_default=func.now(), index=True)
    confidence_score = Column(Float, nullable=False)
    image_path = Column(String(500))
    notification_status = Column(
        Enum("pending", "sent", "failed", name="notification_status_enum"),
        default="pending",
    )
    camera_id = Column(Integer)
    camera_name = Column(String(100))

    notifications = relationship("Notification", back_populates="detection_log")


class Notification(Base):
    __tablename__ = "tbl_Notifications"

    notification_id = Column(Integer, primary_key=True, autoincrement=True)
    log_id = Column(Integer, ForeignKey("tbl_DetectionLog.log_id", ondelete="SET NULL"))
    notification_type = Column(
        Enum("detection", "announcement", name="notification_type_enum"),
        nullable=False,
    )
    title = Column(String(255))
    message = Column(Text)
    status = Column(
        Enum("pending", "sent", "failed", name="notif_delivery_status_enum"),
        default="pending",
    )
    sent_at = Column(DateTime)
    target_group = Column(String(100))
    created_at = Column(DateTime, server_default=func.now())

    detection_log = relationship("DetectionLog", back_populates="notifications")