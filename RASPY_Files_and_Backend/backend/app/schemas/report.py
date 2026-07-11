from pydantic import BaseModel
from typing import Optional
from datetime import date, datetime


class ReportCreate(BaseModel):
    title: str
    report_type: str
    start_date: Optional[date] = None
    end_date: Optional[date] = None
    file_format: str = "pdf"


class ReportResponse(BaseModel):
    report_id: int
    title: str
    file_format: str
    report_type: str
    start_date: Optional[date] = None
    end_date: Optional[date] = None
    file_path: Optional[str] = None
    created_by: Optional[int] = None
    created_at: Optional[datetime] = None

    class Config:
        from_attributes = True
