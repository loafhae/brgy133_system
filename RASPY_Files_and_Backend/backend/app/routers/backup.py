import os, subprocess, shutil, zipfile, json
from datetime import datetime
from pathlib import Path
import logging
from fastapi import APIRouter, Depends, HTTPException
from fastapi.responses import FileResponse
from sqlalchemy.orm import Session
from app.database import get_db
from app.dependencies import require_role
from app.models.user import User
from app.models.settings import SystemSetting
from app.config import settings as app_settings
from app.paths import BACKUP_DIR, FEEDBACK_UPLOAD_DIR, UPLOAD_DIR

router = APIRouter(prefix="/backup", tags=["backup"])
logger = logging.getLogger(__name__)

MYSQLDUMP_PATHS = [
    r"C:\xampp\mysql\bin\mysqldump.exe",
    r"C:\Program Files\MariaDB 10.11\bin\mysqldump.exe",
    r"C:\Program Files\MySQL\MySQL Server 8.0\bin\mysqldump.exe",
]


def _find_mysqldump():
    for p in MYSQLDUMP_PATHS:
        if os.path.exists(p):
            return p
    which = shutil.which("mysqldump")
    if which:
        return which
    return None


def _create_backup_archive() -> str:
    timestamp = datetime.now().strftime("%Y%m%d_%H%M%S_%f")
    archive_name = f"backup_{timestamp}.zip"
    archive_path = os.path.join(str(BACKUP_DIR), archive_name)
    temporary_archive = f"{archive_path}.tmp"
    dump_path = os.path.join(str(BACKUP_DIR), f"temp_{timestamp}.sql")
    mysqldump = _find_mysqldump()
    if not mysqldump:
        raise RuntimeError("mysqldump was not found; no backup archive was created.")

    cmd = [
        mysqldump,
        f"--host={app_settings.DATABASE_HOST}",
        f"--port={app_settings.RESOLVED_PORT}",
        f"--user={app_settings.DATABASE_USER}",
        "--routines",
        "--triggers",
        "--single-transaction",
        app_settings.DATABASE_NAME,
    ]
    env = os.environ.copy()
    env["MYSQL_PWD"] = app_settings.DATABASE_PASSWORD

    try:
        with open(dump_path, "wb") as dump_file:
            result = subprocess.run(
                cmd,
                stdout=dump_file,
                stderr=subprocess.PIPE,
                env=env,
                timeout=300,
                check=False,
            )
        if result.returncode != 0:
            raise RuntimeError(
                f"mysqldump failed with exit code {result.returncode}: "
                f"{result.stderr.decode(errors='replace').strip()}"
            )
        if os.path.getsize(dump_path) == 0:
            raise RuntimeError("mysqldump produced an empty database dump.")

        with zipfile.ZipFile(temporary_archive, "w", zipfile.ZIP_DEFLATED) as archive:
            archive.write(dump_path, "database.sql")
            for source_dir in (UPLOAD_DIR, FEEDBACK_UPLOAD_DIR):
                for root, _, files in os.walk(source_dir):
                    for filename in files:
                        file_path = os.path.join(root, filename)
                        archive_name = os.path.relpath(file_path, str(UPLOAD_DIR.parent))
                        archive.write(file_path, archive_name)

            from app.database import SessionLocal

            db = SessionLocal()
            try:
                settings_export = {
                    "settings": {
                        setting.config_key: setting.config_value
                        for setting in db.query(SystemSetting).all()
                    }
                }
            finally:
                db.close()
            archive.writestr("settings_export.json", json.dumps(settings_export, indent=2))

        os.replace(temporary_archive, archive_path)
        return archive_name
    finally:
        for temporary_path in (dump_path, temporary_archive):
            if os.path.exists(temporary_path):
                os.remove(temporary_path)


@router.post("")
def create_backup(current_user: User = Depends(require_role("super_admin"))):
    try:
        archive_name = _create_backup_archive()
        archive_path = os.path.join(str(BACKUP_DIR), archive_name)
        size_kb = round(os.path.getsize(archive_path) / 1024, 1)
        return {
            "message": "Backup created successfully",
            "filename": archive_name,
            "size_kb": size_kb,
            "created_at": datetime.now().isoformat(),
        }
    except Exception as e:
        logger.exception("Backup creation failed")
        raise HTTPException(
            status_code=500,
            detail="Backup failed; no successful backup was created.",
        ) from e


@router.get("")
def list_backups(current_user: User = Depends(require_role("super_admin"))):
    backups = []
    for f in sorted(BACKUP_DIR.iterdir(), key=os.path.getmtime, reverse=True):
        if f.suffix == ".zip" and f.name.startswith("backup_"):
            mtime = os.path.getmtime(f)
            backups.append({
                "filename": f.name,
                "size_kb": round(f.stat().st_size / 1024, 1),
                "created_at": datetime.fromtimestamp(mtime).isoformat(),
            })
    return backups


@router.get("/{filename}")
def download_backup(filename: str, current_user: User = Depends(require_role("super_admin"))):
    filepath = _resolve_backup_path(filename)
    if filepath is None or not filepath.is_file():
        raise HTTPException(status_code=404, detail="Backup not found")
    return FileResponse(
        path=str(filepath),
        filename=filename,
        media_type="application/zip",
        headers={"Content-Disposition": f"attachment; filename={filename}"},
    )


@router.delete("/{filename}")
def delete_backup(filename: str, current_user: User = Depends(require_role("super_admin"))):
    filepath = _resolve_backup_path(filename)
    if filepath is None or not filepath.is_file():
        raise HTTPException(status_code=404, detail="Backup not found")
    os.remove(filepath)
    return {"message": f"Backup '{filename}' deleted"}


def _resolve_backup_path(filename: str) -> Path | None:
    if Path(filename).name != filename or not filename.startswith("backup_") or not filename.endswith(".zip"):
        return None
    backup_path = (BACKUP_DIR / filename).resolve()
    if backup_path.parent != BACKUP_DIR.resolve():
        return None
    return backup_path