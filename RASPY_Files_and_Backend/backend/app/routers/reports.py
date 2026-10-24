import os
from pathlib import Path
from fastapi import APIRouter, Depends, HTTPException
from fastapi.responses import FileResponse
from sqlalchemy.orm import Session
from app.database import get_db
from app.dependencies import require_role
from app.models.user import User
from app.models.reports import Report
from app.schemas.report import ReportCreate, ReportResponse
from app.services.report_service import generate_report
from app.paths import REPORT_UPLOAD_DIR

router = APIRouter(prefix="/reports", tags=["reports"])


@router.get("", response_model=list[dict])
def list_reports(
    db: Session = Depends(get_db),
    current_user: User = Depends(require_role("super_admin", "official")),
):
    reports = db.query(Report).order_by(Report.created_at.desc()).all()
    return [
        {
            "report_id": r.report_id,
            "title": r.title,
            "report_type": r.report_type,
            "file_format": r.file_format,
            "start_date": str(r.start_date) if r.start_date else None,
            "end_date": str(r.end_date) if r.end_date else None,
            "download_url": f"/api/reports/{r.report_id}/download" if r.file_path else None,
            "created_at": str(r.created_at) if r.created_at else None,
        }
        for r in reports
    ]


@router.get("/{report_id}/download")
def download_report(
    report_id: int,
    db: Session = Depends(get_db),
    current_user: User = Depends(require_role("super_admin", "official")),
):
    report = db.query(Report).filter(Report.report_id == report_id).first()
    if not report or not report.file_path:
        raise HTTPException(status_code=404, detail="Report not found")

    report_path = Path(report.file_path).resolve()
    report_dir = REPORT_UPLOAD_DIR.resolve()
    if report_path.parent != report_dir or not report_path.is_file():
        raise HTTPException(status_code=404, detail="Report file not found")

    media_type = (
        "application/vnd.openxmlformats-officedocument.wordprocessingml.document"
        if report.file_format == "docx"
        else "application/pdf"
    )
    return FileResponse(report_path, filename=report_path.name, media_type=media_type)


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


@router.delete("/{report_id}")
def delete_report(
    report_id: int,
    db: Session = Depends(get_db),
    current_user: User = Depends(require_role("super_admin", "official")),
):
    report = db.query(Report).filter(Report.report_id == report_id).first()
    if not report:
        raise HTTPException(status_code=404, detail="Report not found")
    if report.file_path and os.path.exists(report.file_path):
        os.remove(report.file_path)
    db.delete(report)
    db.commit()
    return {"message": "Report deleted"}