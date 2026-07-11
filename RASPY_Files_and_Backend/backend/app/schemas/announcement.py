from pydantic import BaseModel
from typing import Optional
from datetime import datetime


class AnnouncementCreate(BaseModel):
    title: str
    content: str
    is_published: bool = True


class AnnouncementUpdate(BaseModel):
    title: Optional[str] = None
    content: Optional[str] = None
    is_published: Optional[bool] = None


class AnnouncementResponse(BaseModel):
    announcement_id: int
    created_by: int
    title: str
    content: str
    date_posted: Optional[datetime] = None
    is_published: bool
    attachment_path: Optional[str] = None

    class Config:
        from_attributes = True
