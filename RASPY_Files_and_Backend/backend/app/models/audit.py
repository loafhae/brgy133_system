from sqlalchemy import Column, Integer, String, ForeignKey, Text, DateTime
from sqlalchemy.sql import func
from sqlalchemy.orm import relationship
from app.database import Base

class AuditLog(Base):
    __tablename__ = "tbl_audit_log"

    log_id = Column(Integer, primary_key=True, autoincrement=True)
    action_type = Column(String(255), nullable=False)
    target_table = Column(String(255))
    target_id = Column(Integer)
    description = Column(Text)
    ip_address = Column(String(45))
    timestamp = Column(DateTime, server_default=func.now())
    user_id = Column(Integer, ForeignKey("tbl_users.user_id", ondelete="CASCADE"), nullable=True)

    user = relationship(
        "User",
        primaryjoin="AuditLog.user_id == User.user_id"
    )