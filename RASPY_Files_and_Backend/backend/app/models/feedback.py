from sqlalchemy import Column, Integer, String, Text, DateTime, ForeignKey
from sqlalchemy.orm import relationship
from sqlalchemy.sql import func
from app.database import Base


class Feedback(Base):
    __tablename__ = "tbl_Feedback"

    feedback_id = Column(Integer, primary_key=True, autoincrement=True)
    created_by = Column(Integer, ForeignKey("tbl_Users.user_id", ondelete="CASCADE"), nullable=False)
    subject = Column(String(255), nullable=False)
    content = Column(Text, nullable=False)
    timestamp = Column(DateTime, server_default=func.now())
    attachment_path = Column(String(500))

    author = relationship("User", back_populates="feedbacks")
