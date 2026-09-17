from fastapi import APIRouter, Depends
from sqlalchemy.orm import Session
from app.database import get_db
from app.models.user import User, Resident
# from app.models.feedback import Feedback # Uncomment if you have a feedback model

router = APIRouter(prefix="/api/dashboard", tags=["dashboard"])

@router.get("/stats")
def get_dashboard_stats(db: Session = Depends(get_db)):
    total_users = db.query(User).count()
    total_residents = db.query(Resident).count()
    # total_feedback = db.query(Feedback).count() # adjust as needed
    total_feedback = 0 

    return {
        "total_users": total_users,
        "total_residents": total_residents,
        "total_feedback": total_feedback
    }