from sqlalchemy import Column, Integer, String, ForeignKey, Text, DateTime
from sqlalchemy.sql import func
from sqlalchemy.orm import relationship
from app.database import Base

class Feedback(Base):
    __tablename__ = "tbl_feedback" 

    feedback_id = Column(Integer, primary_key=True, autoincrement=True)
    subject = Column(String(255))
    content = Column(Text, nullable=False)
    timestamp = Column(DateTime, server_default=func.now())
    attachment_path = Column(String(500))
    created_by = Column(Integer, ForeignKey("tbl_users.user_id", ondelete="CASCADE"), nullable=False)
    is_resolved = Column(Integer, default=0)
    resolved_at = Column(DateTime, nullable=True)

    author = relationship(
        "User", 
        primaryjoin="Feedback.created_by == User.user_id"
    )