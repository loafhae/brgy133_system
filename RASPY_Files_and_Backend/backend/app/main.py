import os
from contextlib import asynccontextmanager
from fastapi import FastAPI
from fastapi.staticfiles import StaticFiles
from fastapi.responses import FileResponse
from sqlalchemy import create_engine, text
from app.config import settings
from app.database import engine, Base, SessionLocal
from app.middleware.cors import setup_cors
from app.paths import UPLOAD_DIR
from app.models import (
    User, Admin, Official, Resident,
    DetectionLog, Notification,
    Announcement, Feedback, Report,
    SystemSetting, AuditLog,
)
from app.services.auth_service import hash_password

from app.routers import (
    auth, users, residents, announcements,
    feedback, dashboard, reports, activity,
    settings as settings_router, detection, websocket,
)


def ensure_database_exists():
    db_name = settings.DATABASE_NAME
    resolved_port = settings.RESOLVED_PORT
    root_url = (
        f"mysql+pymysql://{settings.DATABASE_USER}:{settings.DATABASE_PASSWORD}"
        f"@{settings.DATABASE_HOST}:{resolved_port}/mysql"
    )
    temp_engine = create_engine(root_url, pool_pre_ping=True)
    try:
        with temp_engine.connect() as conn:
            conn.execute(text(f"CREATE DATABASE IF NOT EXISTS `{db_name}`"))
            conn.commit()
            print(f"[OK] Database '{db_name}' is ready on port {resolved_port}.")
    except Exception as e:
        print(f"[ERROR] Could not auto-create database: {e}")
        print(f"[INFO] Make sure XAMPP MariaDB is running on port {resolved_port} (or check standard ports 3306/3307/3308).")
        raise SystemExit(1)
    finally:
        temp_engine.dispose()


def seed_default_data():
    db = SessionLocal()
    try:
        admin_exists = db.query(User).filter(User.roles == "super_admin").first()
        if not admin_exists:
            admin_user = User(
                username="admin",
                password=hash_password("admin123"),
                roles="super_admin",
            )
            db.add(admin_user)
            db.commit()
            print("[OK] Default admin account created (admin / admin123)")

        defaults = {
            "notification_cooldown": "300",
            "detection_enabled": "true",
            "camera_quality": "480p",
            "backup_enabled": "true",
        }
        for key, value in defaults.items():
            exists = db.query(SystemSetting).filter(SystemSetting.config_key == key).first()
            if not exists:
                db.add(SystemSetting(config_key=key, config_value=value))
        db.commit()
    finally:
        db.close()


@asynccontextmanager
async def lifespan(app: FastAPI):
    ensure_database_exists()
    Base.metadata.create_all(bind=engine)
    seed_default_data()
    yield


app = FastAPI(
    title="Vision-Trak Backend",
    description="Multi-Platform Barangay Announcement and Garbage Collection Notifier API",
    version="1.0.0",
    lifespan=lifespan,
)

setup_cors(app)

app.mount("/uploads", StaticFiles(directory=str(UPLOAD_DIR)), name="uploads")

_snapshots_dir = os.path.join(os.path.dirname(os.path.dirname(os.path.abspath(__file__))), "snapshots")
if not os.path.exists(_snapshots_dir):
    os.makedirs(_snapshots_dir, exist_ok=True)
app.mount("/snapshots", StaticFiles(directory=_snapshots_dir), name="snapshots")

app.include_router(auth.router)
app.include_router(users.router)
app.include_router(residents.router)
app.include_router(announcements.router)
app.include_router(feedback.router)
app.include_router(dashboard.router)
app.include_router(reports.router)
app.include_router(activity.router)
app.include_router(settings_router.router)
app.include_router(detection.router)
app.include_router(websocket.router)


@app.get("/")
def root():
    return {"message": "Vision-Trak Backend is running", "docs": "/docs"}


_project_root = os.path.dirname(os.path.dirname(os.path.abspath(__file__)))
_test_html = os.path.join(_project_root, "test.html")
_dashboard_html = os.path.join(_project_root, "dashboard.html")
if os.path.exists(_test_html):

    @app.get("/test.html")
    def get_test_html():
        return FileResponse(_test_html)
if os.path.exists(_dashboard_html):

    @app.get("/dashboard.html")
    def get_dashboard_html():
        return FileResponse(_dashboard_html)
