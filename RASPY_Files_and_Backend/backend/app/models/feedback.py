from sqlalchemy import Column, Integer, String, ForeignKey, Text, DateTime
from sqlalchemy.orm import relationship
from app.database import Base

class Feedback(Base):
    # Ensure this matches your actual table name casing in phpMyAdmin
    __tablename__ = "tbl_feedback" 

    feedback_id = Column(Integer, primary_key=True, autoincrement=True)
    content = Column(Text, nullable=False)
    
    # 📝 Check if your column is named 'user_id' or something else, and map it here:
    user_id = Column(Integer, ForeignKey("tbl_users.user_id", ondelete="CASCADE"), nullable=False)

    # ✅ FIXED: Explicitly specify the join condition to prevent key mapping failures
    author = relationship(
        "User", 
        primaryjoin="Feedback.user_id == User.user_id"
    )