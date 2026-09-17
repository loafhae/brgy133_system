from datetime import datetime
from sqlalchemy.orm import Session
from app.models.detection import DetectionLog
from app.services.notification_service import create_detection_notification


class DetectionService:
    def __init__(self, db: Session):
        self.db = db

    def process_detection(
        self,
        camera_id: int,
        camera_name: str,
        confidence: float,
        image_path: str | None = None,
    ) -> DetectionLog:
        log = DetectionLog(
            confidence_score=confidence,
            image_path=image_path,
            camera_id=camera_id,
            camera_name=camera_name,
            notification_status="pending",
        )
        self.db.add(log)
        self.db.commit()
        self.db.refresh(log)

        notification = create_detection_notification(self.db, log)
        if notification:
            log.notification_status = "sent"
            self.db.commit()
        else:
            log.notification_status = "failed"
            self.db.commit()

        return log