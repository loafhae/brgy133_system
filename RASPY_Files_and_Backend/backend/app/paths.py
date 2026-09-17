from pathlib import Path

BASE_DIR = Path(__file__).resolve().parent.parent

UPLOAD_DIR = BASE_DIR / "uploads"
DETECTION_UPLOAD_DIR = UPLOAD_DIR / "detections"
ANNOUNCEMENT_UPLOAD_DIR = UPLOAD_DIR / "announcements"
FEEDBACK_UPLOAD_DIR = UPLOAD_DIR / "feedback"
REPORT_UPLOAD_DIR = UPLOAD_DIR / "reports"
PROFILE_PIC_DIR = UPLOAD_DIR / "profile_pics"
BACKUP_DIR = BASE_DIR / "backups"

for d in [UPLOAD_DIR, DETECTION_UPLOAD_DIR, ANNOUNCEMENT_UPLOAD_DIR,
          FEEDBACK_UPLOAD_DIR, REPORT_UPLOAD_DIR, PROFILE_PIC_DIR, BACKUP_DIR]:
    d.mkdir(parents=True, exist_ok=True)