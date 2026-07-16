from sqlalchemy import Column, Integer, String, Enum, Date, DateTime, ForeignKey
from sqlalchemy.sql import func
from app.database import Base


class Report(Base):
    __tablename__ = "tbl_Reports"

    report_id = Column(Integer, primary_key=True, autoincrement=True)
    title = Column(String(255), nullable=False)
    file_format = Column(Enum("pdf", "csv", name="file_format_enum"), default="pdf")
    report_type = Column(
        Enum("announcement", "feedback", "activity", "detection", name="report_type_enum"),
        nullable=False,
    )
    start_date = Column(Date)
    end_date = Column(Date)
    file_path = Column(String(500))
    created_by = Column(Integer, ForeignKey("tbl_users.user_id", ondelete="SET NULL"))
    created_at = Column(DateTime, server_default=func.now())
