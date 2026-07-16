from pydantic import BaseModel
from typing import Optional
from datetime import datetime


class FeedbackCreate(BaseModel):
    subject: str
    content: str


class FeedbackUpdate(BaseModel):
    is_resolved: bool


class FeedbackResponse(BaseModel):
    feedback_id: int
    created_by: int
    username: str
    subject: str
    content: str
    timestamp: Optional[datetime] = None
    attachment_path: Optional[str] = None
    is_resolved: Optional[int] = 0
    resolved_at: Optional[datetime] = None

    class Config:
        from_attributes = True
