from sqlalchemy import Column, Integer, String, Text, DateTime, ForeignKey
from sqlalchemy.sql import func
from app.database import Base


class SystemSetting(Base):
    __tablename__ = "tbl_SystemSettings"

    system_id = Column(Integer, primary_key=True, autoincrement=True)
    updated_by = Column(Integer, ForeignKey("tbl_users.user_id", ondelete="SET NULL"))
    config_key = Column(String(100), unique=True, nullable=False)
    config_value = Column(Text)
    updated_at = Column(DateTime, server_default=func.now(), onupdate=func.now())