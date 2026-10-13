from pydantic import BaseModel, Field
from typing import List, Optional
from datetime import datetime


class FeedbackCreate(BaseModel):
    subject: str
    content: str


class FeedbackUpdate(BaseModel):
    is_resolved: bool


class FeedbackAttachmentResponse(BaseModel):
    attachment_id: str
    original_filename: str
    mime_type: str
    file_size: int


class FeedbackResponse(BaseModel):
    feedback_id: int
    created_by: int
    username: str
    subject: str
    content: str
    timestamp: Optional[datetime] = None
    attachment_path: Optional[str] = None
    attachments: List[FeedbackAttachmentResponse] = Field(default_factory=list)
    is_resolved: Optional[int] = 0
    resolved_at: Optional[datetime] = None

    class Config:
        from_attributes = True