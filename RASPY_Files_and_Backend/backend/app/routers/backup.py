import os, subprocess, shutil, zipfile, json
from datetime import datetime
from fastapi import APIRouter, Depends, HTTPException
from fastapi.responses import FileResponse
from sqlalchemy.orm import Session
from app.database import get_db
from app.dependencies import require_role
from app.models.user import User
from app.models.settings import SystemSetting
from app.config import settings as app_settings
from app.paths import BACKUP_DIR, UPLOAD_DIR

router = APIRouter(prefix="/api/backup", tags=["backup"])

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
    timestamp = datetime.now().strftime("%Y%m%d_%H%M%S")
    archive_name = f"backup_{timestamp}.zip"
    archive_path = os.path.join(str(BACKUP_DIR), archive_name)

    with zipfile.ZipFile(archive_path, "w", zipfile.ZIP_DEFLATED) as zf:
        dump_path = os.path.join(str(BACKUP_DIR), f"temp_{timestamp}.sql")
        try:
            mysqldump = _find_mysqldump()
            if not mysqldump:
                zf.writestr("database.sql", "-- mysqldump not found on this system")
            else:
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
                if app_settings.DATABASE_PASSWORD:
                    env["MYSQL_PWD"] = app_settings.DATABASE_PASSWORD
                result = subprocess.run(cmd, capture_output=True, text=True, env=env)
                if result.returncode == 0:
                    with open(dump_path, "w", encoding="utf-8") as f:
                        f.write(result.stdout)
                    zf.write(dump_path, "database.sql")
                else:
                    zf.writestr("database.sql", f"-- mysqldump failed:\n-- {result.stderr}")
        finally:
            if os.path.exists(dump_path):
                os.remove(dump_path)

        if UPLOAD_DIR.exists():
            for root, dirs, files in os.walk(str(UPLOAD_DIR)):
                for f in files:
                    fp = os.path.join(root, f)
                    arcname = os.path.relpath(fp, str(UPLOAD_DIR.parent))
                    zf.write(fp, arcname)

        db_data = {"settings": {}}
        try:
            from app.database import SessionLocal
            dbs = SessionLocal()
            try:
                for s in dbs.query(SystemSetting).all():
                    db_data["settings"][s.config_key] = s.config_value
            finally:
                dbs.close()
        except Exception:
            pass
        zf.writestr("settings_export.json", json.dumps(db_data, indent=2))

    return archive_name


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
        raise HTTPException(status_code=500, detail=f"Backup failed: {str(e)}")


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
    filepath = BACKUP_DIR / filename
    if not filepath.exists():
        raise HTTPException(status_code=404, detail="Backup not found")
    return FileResponse(
        path=str(filepath),
        filename=filename,
        media_type="application/zip",
        headers={"Content-Disposition": f"attachment; filename={filename}"},
    )


@router.delete("/{filename}")
def delete_backup(filename: str, current_user: User = Depends(require_role("super_admin"))):
    filepath = BACKUP_DIR / filename
    if not filepath.exists():
        raise HTTPException(status_code=404, detail="Backup not found")
    os.remove(filepath)
    return {"message": f"Backup '{filename}' deleted"}