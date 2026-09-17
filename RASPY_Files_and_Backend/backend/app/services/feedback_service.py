from datetime import datetime, timedelta
from sqlalchemy.orm import Session
from app.models.feedback import Feedback


def check_duplicate_feedback(db: Session, user_id: int, content: str) -> bool:
    cooldown = timedelta(minutes=5)
    recent = db.query(Feedback).filter(
        Feedback.created_by == user_id,
        Feedback.content == content,
        Feedback.timestamp >= datetime.now() - cooldown,
    ).first()
    return recent is not None