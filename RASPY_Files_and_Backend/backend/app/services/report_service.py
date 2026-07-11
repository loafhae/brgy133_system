from datetime import date
from pathlib import Path
from sqlalchemy.orm import Session
from app.models.reports import Report
from app.models.feedback import Feedback
from app.models.detection import DetectionLog
from app.models.announcement import Announcement
from app.paths import REPORT_UPLOAD_DIR


def generate_report(
    db: Session,
    title: str,
    report_type: str,
    start_date: date | None = None,
    end_date: date | None = None,
    file_format: str = "pdf",
    created_by: int | None = None,
) -> Report:
    records = []
    if report_type == "feedback":
        q = db.query(Feedback)
        if start_date:
            q = q.filter(Feedback.timestamp >= start_date)
        if end_date:
            q = q.filter(Feedback.timestamp <= end_date)
        records = q.all()
    elif report_type == "detection":
        q = db.query(DetectionLog)
        if start_date:
            q = q.filter(DetectionLog.timestamp >= start_date)
        if end_date:
            q = q.filter(DetectionLog.timestamp <= end_date)
        records = q.all()
    elif report_type == "announcement":
        q = db.query(Announcement)
        if start_date:
            q = q.filter(Announcement.date_posted >= start_date)
        if end_date:
            q = q.filter(Announcement.date_posted <= end_date)
        records = q.all()

    filename = f"{report_type}_{date.today().isoformat()}.{file_format}"
    filepath = REPORT_UPLOAD_DIR / filename
    filepath.parent.mkdir(parents=True, exist_ok=True)

    try:
        from reportlab.lib.pagesizes import letter
        from reportlab.pdfgen import canvas as pdf_canvas

        c = pdf_canvas.Canvas(str(filepath), pagesize=letter)
        c.setFont("Helvetica", 16)
        c.drawString(72, 750, title)
        c.setFont("Helvetica", 11)
        c.drawString(72, 730, f"Report Type: {report_type}")
        c.drawString(72, 715, f"Date Range: {start_date or 'N/A'} to {end_date or 'N/A'}")
        c.drawString(72, 700, f"Total Records: {len(records)}")
        y = 670
        for i, record in enumerate(records[:40]):
            if y < 72:
                c.showPage()
                y = 750
            c.drawString(72, y, f"{i+1}. {record}")
            y -= 15
        c.save()
    except Exception:
        filepath.write_text(f"Report: {title}\nType: {report_type}\nRecords: {len(records)}")

    report = Report(
        title=title,
        file_format=file_format,
        report_type=report_type,
        start_date=start_date,
        end_date=end_date,
        file_path=str(filepath),
        created_by=created_by,
    )
    db.add(report)
    db.commit()
    db.refresh(report)
    return report
