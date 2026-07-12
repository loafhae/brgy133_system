from sqlalchemy import Column, Integer, String, ForeignKey, Text, DateTime
from sqlalchemy.orm import relationship
from app.database import Base

class AuditLog(Base):
    # Ensure this matches your actual table name casing in phpMyAdmin (e.g., tbl_audit_logs or tbl_AuditLog)
    __tablename__ = "tbl_audit_log" 

    log_id = Column(Integer, primary_key=True, autoincrement=True)
    action = Column(String(255), nullable=False)
    
    # 📝 Verify if your column is named 'user_id' or something similar:
    user_id = Column(Integer, ForeignKey("tbl_users.user_id", ondelete="CASCADE"), nullable=False)

    # ✅ FIXED: Explicitly specify the join condition to complete the relationship mapping chain
    user = relationship(
        "User", 
        primaryjoin="AuditLog.user_id == User.user_id"
    )