from fastapi import APIRouter, Depends, HTTPException, status, Query
from sqlalchemy.orm import Session, joinedload
from datetime import datetime, timedelta
from typing import Optional
from app.database import get_db
from app.dependencies import require_role, get_current_user
from app.models.user import User
from app.models.feedback import Feedback
from app.schemas.feedback import FeedbackCreate, FeedbackResponse

router = APIRouter(prefix="/api/feedback", tags=["feedback"])


@router.get("", response_model=list[FeedbackResponse])
def list_feedback(
    search: Optional[str] = None,
    page: int = Query(1, ge=1),
    limit: int = Query(20, ge=1, le=100),
    db: Session = Depends(get_db),
    current_user: User = Depends(require_role("super_admin", "official", "resident")),
):
    query = db.query(Feedback).options(joinedload(Feedback.author))
    if current_user.roles == "resident":
        query = query.filter(Feedback.created_by == current_user.user_id)
    if search:
        query = query.filter(Feedback.subject.ilike(f"%{search}%"))
    feedbacks = query.order_by(Feedback.timestamp.desc()).offset((page - 1) * limit).limit(limit).all()
    return [
        FeedbackResponse(
            feedback_id=f.feedback_id,
            created_by=f.created_by,
            username=f.author.username if f.author else "Unknown",
            subject=f.subject,
            content=f.content,
            timestamp=f.timestamp,
            attachment_path=f.attachment_path,
        )
        for f in feedbacks
    ]


@router.get("/{feedback_id}", response_model=FeedbackResponse)
def get_feedback(
    feedback_id: int,
    db: Session = Depends(get_db),
    current_user: User = Depends(require_role("super_admin", "official", "resident")),
):
    feedback = db.query(Feedback).options(joinedload(Feedback.author)).filter(Feedback.feedback_id == feedback_id).first()
    if not feedback:
        raise HTTPException(status_code=404, detail="Feedback not found")
    if current_user.roles == "resident" and feedback.created_by != current_user.user_id:
        raise HTTPException(status_code=403, detail="Access denied")
    return FeedbackResponse(
        feedback_id=feedback.feedback_id,
        created_by=feedback.created_by,
        username=feedback.author.username if feedback.author else "Unknown",
        subject=feedback.subject,
        content=feedback.content,
        timestamp=feedback.timestamp,
        attachment_path=feedback.attachment_path,
    )


@router.post("", response_model=FeedbackResponse, status_code=status.HTTP_201_CREATED)
def submit_feedback(
    body: FeedbackCreate,
    db: Session = Depends(get_db),
    current_user: User = Depends(require_role("resident")),
):
    cooldown = timedelta(minutes=5)
    recent = db.query(Feedback).filter(
        Feedback.created_by == current_user.user_id,
        Feedback.content == body.content,
        Feedback.timestamp >= datetime.now() - cooldown,
    ).first()
    if recent:
        raise HTTPException(
            status_code=429,
            detail="Duplicate feedback within 5 minutes. Please wait before submitting again.",
        )

    feedback = Feedback(
        created_by=current_user.user_id,
        subject=body.subject,
        content=body.content,
    )
    db.add(feedback)
    db.commit()
    db.refresh(feedback)
    return feedback


@router.delete("/{feedback_id}", status_code=status.HTTP_204_NO_CONTENT)
def delete_feedback(
    feedback_id: int,
    db: Session = Depends(get_db),
    current_user: User = Depends(require_role("super_admin")),
):
    feedback = db.query(Feedback).filter(Feedback.feedback_id == feedback_id).first()
    if not feedback:
        raise HTTPException(status_code=404, detail="Feedback not found")
    db.delete(feedback)
    db.commit()
    return None
