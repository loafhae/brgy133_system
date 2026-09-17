from sqlalchemy import Column, Integer, String, Boolean, ForeignKey, Text, DateTime
from sqlalchemy.sql import func
from sqlalchemy.orm import relationship
from app.database import Base

class Announcement(Base):
    __tablename__ = "tbl_announcement"

    announcement_id = Column(Integer, primary_key=True, autoincrement=True)
    title = Column(String(255), nullable=False)
    content = Column(Text, nullable=False)
    date_posted = Column(DateTime, server_default=func.now())
    is_published = Column(Boolean, default=True)
    attachment_path = Column(String(500))
    created_by = Column(Integer, ForeignKey("tbl_users.user_id", ondelete="CASCADE"), nullable=False)

    creator = relationship(
        "User",
        primaryjoin="Announcement.created_by == User.user_id"
    )