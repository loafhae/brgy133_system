from pydantic import BaseModel
from typing import Optional
from datetime import datetime


class FeedbackCreate(BaseModel):
    subject: str
    content: str


class FeedbackResponse(BaseModel):
    feedback_id: int
    created_by: int
    username: str
    subject: str
    content: str
    timestamp: Optional[datetime] = None
    attachment_path: Optional[str] = None

    class Config:
        from_attributes = True
