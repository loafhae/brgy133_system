from sqlalchemy import Column, Integer, String, Text, Boolean, DateTime, ForeignKey
from sqlalchemy.orm import relationship
from sqlalchemy.sql import func
from app.database import Base


class Announcement(Base):
    __tablename__ = "tbl_Announcement"

    announcement_id = Column(Integer, primary_key=True, autoincrement=True)
    created_by = Column(Integer, ForeignKey("tbl_Users.user_id", ondelete="CASCADE"), nullable=False)
    title = Column(String(255), nullable=False)
    content = Column(Text, nullable=False)
    date_posted = Column(DateTime, server_default=func.now())
    is_published = Column(Boolean, default=True)
    attachment_path = Column(String(500))

    creator = relationship("User", back_populates="announcements")
