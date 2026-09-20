from fastapi import APIRouter, Depends
from sqlalchemy.orm import Session
from app.database import get_db
from app.models.user import User, Resident
from app.models.feedback import Feedback
from app.models.announcement import Announcement
from app.models.detection import DetectionLog

router = APIRouter(prefix="/api/dashboard", tags=["dashboard"])

@router.get("/stats")
def get_dashboard_stats(db: Session = Depends(get_db)):
    total_users = db.query(User).count()
    total_residents = db.query(Resident).count()
    total_feedback = db.query(Feedback).count()
    pending_feedback = db.query(Feedback).filter(Feedback.is_resolved == 0).count()
    total_announcements = db.query(Announcement).filter(Announcement.is_published == True).count()
    total_detections = db.query(DetectionLog).count()

    return {
        "total_users": total_users,
        "total_residents": total_residents,
        "total_feedback": total_feedback,
        "pending_feedback": pending_feedback,
        "total_announcements": total_announcements,
        "total_detections": total_detections,
    }