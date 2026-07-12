from sqlalchemy import Column, Integer, String, ForeignKey, Text, DateTime
from sqlalchemy.orm import relationship
from app.database import Base

class Announcement(Base):
    # ✅ Ensure this matches your actual announcement table name casing
    __tablename__ = "tbl_announcement" 

    announcement_id = Column(Integer, primary_key=True, autoincrement=True)
    title = Column(String(255), nullable=False)
    content = Column(Text, nullable=False)
    
    # ✅ Check if your foreign key column name is exactly 'created_by' or 'user_id'
    created_by = Column(Integer, ForeignKey("tbl_users.user_id", ondelete="CASCADE"), nullable=False)

    # ✅ FIXED: Explicitly specify the join condition to bypass key auto-detection issues
    creator = relationship(
        "User", 
        primaryjoin="Announcement.created_by == User.user_id"
    )