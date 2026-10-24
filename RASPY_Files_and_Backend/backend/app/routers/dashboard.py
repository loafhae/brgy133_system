from fastapi import APIRouter, Depends
from sqlalchemy.orm import Session
from app.database import get_db
from app.models.user import User, Resident
from app.models.feedback import Feedback
from app.dependencies import require_role

router = APIRouter(prefix="/dashboard", tags=["Dashboard"])

@router.get("/stats")
def get_dashboard_stats(db: Session = Depends(get_db), current_user: User = Depends(require_role("super_admin", "official"))):
    total_users = db.query(User).count()
    total_residents = db.query(Resident).count() if hasattr(Resident, '__table__') else 0
    total_feedback = db.query(Feedback).count() if hasattr(Feedback, '__table__') else 0

    return {
        "total_users": total_users,
        "total_residents": total_residents,
        "total_feedback": total_feedback,
        "user_count": total_users,
        "resident_count": total_residents,
        "pending_feedback": total_feedback,
    }