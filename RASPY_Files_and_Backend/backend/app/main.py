import os
from contextlib import asynccontextmanager
from datetime import datetime, timezone
from fastapi import FastAPI, Depends, HTTPException
from fastapi.staticfiles import StaticFiles
from fastapi.responses import FileResponse
from sqlalchemy import create_engine, text
from sqlalchemy.orm import Session

import firebase_admin
from firebase_admin import credentials

from app.config import settings
from app.database import engine, Base, SessionLocal, get_db
from app.middleware.cors import setup_cors
from app.paths import UPLOAD_DIR
from app.models import (
    User, Admin, Official, Resident,
    DetectionLog, Notification,
    Announcement, Feedback, Report,
    SystemSetting, AuditLog,
)
from app.services.auth_service import hash_password
from app.dependencies import get_current_user

from app.routers import (
    auth, users, residents, announcements,
    feedback, dashboard, reports, activity,
    settings as settings_router, detection, websocket, backup, roles,
)


def ensure_database_exists(retries=5, delay=1.5):
    import time
    db_name = settings.DATABASE_NAME
    resolved_port = settings.RESOLVED_PORT
    root_url = (
        f"mysql+pymysql://{settings.DATABASE_USER}:{settings.DATABASE_PASSWORD}"
        f"@{settings.DATABASE_HOST}:{resolved_port}/mysql"
    )
    for attempt in range(1, retries + 1):
        temp_engine = create_engine(root_url, pool_pre_ping=True)
        try:
            with temp_engine.connect() as conn:
                conn.execute(text(f"CREATE DATABASE IF NOT EXISTS `{db_name}`"))
                conn.commit()
                print(f"[OK] Database '{db_name}' is ready on port {resolved_port}.")
                return True
        except Exception as e:
            if attempt < retries:
                time.sleep(delay)
            else:
                print(f"[ERROR] Could not auto-create/connect to database: {e}")
                print(f"[INFO] Make sure XAMPP MariaDB is running on port {resolved_port} (or check standard ports 3306/3307/3308).")
                return False
        finally:
            temp_engine.dispose()
    return False


def seed_default_data():
    db = next(get_db())
    try:
        admin_exists = db.query(User).filter(User.roles == "super_admin").first()
        if not admin_exists:
            new_admin = User(
                username="admin",
                email="admin@brgy133.com",
                password=hash_password("admin123"),
                roles="super_admin",
                is_approved=1,
            )
            db.add(new_admin)
            db.commit()
    except Exception as e:
        print(f"Data seeding skipped or handled: {e}")
    finally:
        db.close()


@asynccontextmanager
async def lifespan(app: FastAPI):
    db_ok = ensure_database_exists()
    if db_ok:
        try:
            Base.metadata.create_all(bind=engine)
            seed_default_data()
        except Exception as e:
            print(f"[WARNING] Database schema generation error: {e}")
    else:
        print("[WARNING] FastAPI running in degraded mode - MariaDB is not yet accessible.")

    # Initialize Firebase Admin SDK
    try:
        if not firebase_admin._apps:
            cred_path = os.path.join(os.path.dirname(os.path.abspath(__file__)), "serviceAccountKey.json")
            if os.path.exists(cred_path):
                cred = credentials.Certificate(cred_path)
                firebase_admin.initialize_app(cred)
                print("[OK] Firebase Admin SDK initialized successfully.")
            else:
                print(f"[WARNING] Firebase credentials file not found at: {cred_path}")
    except Exception as e:
        print(f"[ERROR] Failed to initialize Firebase Admin SDK: {e}")

    # Safe Schema Migrations for Users Table
    user_columns = [
        ("profile_pic", "VARCHAR(500)"),
        ("must_change_password", "TINYINT DEFAULT 0"),
        ("last_seen", "DATETIME NULL"),
        ("email", "VARCHAR(255) NULL"),
        ("is_approved", "INT DEFAULT 1"),
        ("reset_otp", "VARCHAR(10) NULL"),
        ("otp_expiry", "DATETIME NULL")
    ]
    for col_name, col_type in user_columns:
        try:
            with engine.connect() as conn:
                conn.execute(text(f"ALTER TABLE tbl_users ADD COLUMN `{col_name}` {col_type}"))
                conn.commit()
                print(f"[OK] Added {col_name} to tbl_users")
        except Exception:
            pass

    # Safe Schema Migrations for Announcements Table
    for col in ["date_posted", "is_published", "attachment_path"]:
        try:
            with engine.connect() as conn:
                conn.execute(text(f"ALTER TABLE tbl_announcement ADD COLUMN `{col}` VARCHAR(500)"))
                conn.commit()
                print(f"[OK] Added {col} to tbl_announcement")
        except Exception:
            pass

    try:
        with engine.connect() as conn:
            conn.execute(text("ALTER TABLE tbl_announcement MODIFY date_posted DATETIME DEFAULT CURRENT_TIMESTAMP"))
            conn.commit()
    except Exception:
        pass

    try:
        with engine.connect() as conn:
            conn.execute(text("ALTER TABLE tbl_announcement MODIFY is_published TINYINT DEFAULT 1"))
            conn.commit()
    except Exception:
        pass

    # Safe Schema Migrations for Feedback Table
    for col in ["subject", "timestamp", "attachment_path"]:
        try:
            with engine.connect() as conn:
                conn.execute(text(f"ALTER TABLE tbl_feedback ADD COLUMN `{col}` VARCHAR(500)"))
                conn.commit()
                print(f"[OK] Added {col} to tbl_feedback")
        except Exception:
            pass

    try:
        with engine.connect() as conn:
            conn.execute(text("ALTER TABLE tbl_feedback MODIFY timestamp DATETIME DEFAULT CURRENT_TIMESTAMP"))
            conn.commit()
    except Exception:
        pass

    for col_def in [("created_by", "INT"), ("is_resolved", "INT DEFAULT 0"), ("resolved_at", "DATETIME")]:
        col_name, col_type = col_def
        try:
            with engine.connect() as conn:
                conn.execute(text(f"ALTER TABLE tbl_feedback ADD COLUMN `{col_name}` {col_type}"))
                conn.commit()
                print(f"[OK] Added {col_name} to tbl_feedback")
        except Exception:
            pass

    # Safe Schema Migrations for Audit Log Table
    for col in ["action_type", "target_table", "target_id", "description", "ip_address", "timestamp"]:
        try:
            with engine.connect() as conn:
                conn.execute(text(f"ALTER TABLE tbl_audit_log ADD COLUMN `{col}` VARCHAR(500)"))
                conn.commit()
                print(f"[OK] Added {col} to tbl_audit_log")
        except Exception:
            pass

    try:
        with engine.connect() as conn:
            conn.execute(text("ALTER TABLE tbl_audit_log MODIFY timestamp DATETIME DEFAULT CURRENT_TIMESTAMP"))
            conn.commit()
    except Exception:
        pass

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

_snapshots_dir = os.path.join(os.path.dirname(os.path.dirname(os.path.dirname(os.path.abspath(__file__)))), "snapshots")
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
app.include_router(backup.router)
app.include_router(roles.router)


@app.post("/api/users/heartbeat")
def user_heartbeat(
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user)
):
    current_user.last_seen = datetime.now(timezone.utc)
    db.commit()
    return {"status": "ok", "last_seen": current_user.last_seen}


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