from pydantic import BaseModel
from typing import Optional
from datetime import datetime


class NotificationCreate(BaseModel):
    notification_type: str
    title: str
    message: str
    target_group: Optional[str] = "all_residents"
    log_id: Optional[int] = None


class NotificationResponse(BaseModel):
    notification_id: int
    log_id: Optional[int] = None
    notification_type: str
    title: Optional[str] = None
    message: Optional[str] = None
    status: str
    sent_at: Optional[datetime] = None
    target_group: Optional[str] = None
    created_at: Optional[datetime] = None

    class Config:
        from_attributes = True
