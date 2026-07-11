from sqlalchemy import Column, Integer, String, Text, DateTime, ForeignKey
from sqlalchemy.orm import relationship
from sqlalchemy.sql import func
from app.database import Base


class AuditLog(Base):
    __tablename__ = "tbl_AuditLogs"

    log_id = Column(Integer, primary_key=True, autoincrement=True)
    user_id = Column(Integer, ForeignKey("tbl_Users.user_id", ondelete="SET NULL"))
    action_type = Column(String(50), nullable=False)
    target_table = Column(String(50))
    target_id = Column(Integer)
    description = Column(Text)
    timestamp = Column(DateTime, server_default=func.now(), index=True)
    ip_address = Column(String(45))

    user = relationship("User", back_populates="audit_logs")
