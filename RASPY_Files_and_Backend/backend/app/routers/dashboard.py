from fastapi import APIRouter, Depends
from sqlalchemy.orm import Session
from sqlalchemy import func
from app.database import get_db
from app.dependencies import get_current_user
from app.models.user import User, Resident
from app.models.feedback import Feedback
from app.models.detection import DetectionLog

router = APIRouter(prefix="/api/dashboard", tags=["dashboard"])


@router.get("/stats")
def get_stats(
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user),
):
    user_count = db.query(func.count(User.user_id)).scalar()
    resident_count = db.query(func.count(Resident.resident_id)).scalar()
    pending_feedback = db.query(func.count(Feedback.feedback_id)).scalar()
    total_detections = db.query(func.count(DetectionLog.log_id)).scalar()

    return {
        "user_count": user_count,
        "resident_count": resident_count,
        "pending_feedback": pending_feedback,
        "total_detections": total_detections,
    }
