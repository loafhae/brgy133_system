from fastapi import APIRouter, Depends, HTTPException, Query
from sqlalchemy.orm import Session
from typing import Optional
from datetime import date
from app.database import get_db
from app.dependencies import require_role
from app.models.user import User
from app.models.feedback import Feedback
from app.models.detection import DetectionLog
from app.models.announcement import Announcement
from app.schemas.report import ReportCreate, ReportResponse
from app.services.report_service import generate_report

router = APIRouter(prefix="/api/reports", tags=["reports"])


@router.get("", response_model=list[dict])
def list_reports(
    db: Session = Depends(get_db),
    current_user: User = Depends(require_role("super_admin", "official")),
):
    from app.models.reports import Report
    reports = db.query(Report).order_by(Report.created_at.desc()).all()
    return [
        {
            "report_id": r.report_id,
            "title": r.title,
            "report_type": r.report_type,
            "file_format": r.file_format,
            "start_date": str(r.start_date) if r.start_date else None,
            "end_date": str(r.end_date) if r.end_date else None,
            "file_path": r.file_path,
            "created_at": str(r.created_at) if r.created_at else None,
        }
        for r in reports
    ]


@router.post("/generate", response_model=ReportResponse)
def generate_report_endpoint(
    body: ReportCreate,
    db: Session = Depends(get_db),
    current_user: User = Depends(require_role("super_admin", "official")),
):
    report = generate_report(
        db=db,
        title=body.title,
        report_type=body.report_type,
        start_date=body.start_date,
        end_date=body.end_date,
        file_format=body.file_format,
        created_by=current_user.user_id,
    )
    return report
