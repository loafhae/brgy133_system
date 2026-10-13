import os
from contextlib import asynccontextmanager
from datetime import datetime, timezone
from fastapi import FastAPI, Depends, HTTPException, Header, Request
from fastapi.middleware.cors import CORSMiddleware
from fastapi.staticfiles import StaticFiles
from sqlalchemy import create_engine, text
from sqlalchemy.orm import Session

import firebase_admin
from firebase_admin import credentials

from app.config import settings
from app.database import engine, Base, get_db
from app.paths import UPLOAD_DIR
from app.models import (
    User, Resident,
    DetectionLog, Notification,
    Announcement, Feedback, Report,
    SystemSetting, AuditLog,
)
from app.services.auth_service import hash_password
from app.dependencies import get_current_user
from app.middleware.ip_logger import IPLoggerMiddleware

from app.routers import (
    auth, users, residents, announcements,
    feedback, dashboard, reports, activity,
    settings as settings_router, detection, websocket, backup, roles,
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
        print(f"[INFO] Make sure XAMPP MariaDB is running on port {resolved_port}.")
        raise SystemExit(1)
    finally:
        temp_engine.dispose()


def seed_default_data():
    db = next(get_db())
    try:
        admin_exists = db.query(User).filter(User.roles.like("%super_admin%")).first()
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
    ensure_database_exists()
    Base.metadata.create_all(bind=engine)

    try:
        if not firebase_admin._apps:
            cred_path = os.path.join(os.path.dirname(os.path.abspath(__file__)), "serviceAccountKey.json")
            if os.path.exists(cred_path):
                cred = credentials.Certificate(cred_path)
                firebase_admin.initialize_app(cred)
                print("[OK] Firebase Admin SDK initialized successfully.")
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

# Open CORS configuration to support dynamic Flutter Web dev ports
app.add_middleware(
    CORSMiddleware,
    allow_origin_regex=r"^https?://(localhost|127\.0\.0\.1)(:\d+)?$",
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# IP Logger middleware for audit logging
app.add_middleware(IPLoggerMiddleware)

app.mount("/uploads", StaticFiles(directory=str(UPLOAD_DIR)), name="uploads")

_snapshots_dir = os.path.join(os.path.dirname(os.path.dirname(os.path.dirname(os.path.abspath(__file__)))), "snapshots")
if not os.path.exists(_snapshots_dir):
    os.makedirs(_snapshots_dir, exist_ok=True)
app.mount("/snapshots", StaticFiles(directory=_snapshots_dir), name="snapshots")

# All routers use prefix="/api"
app.include_router(auth.router, prefix="/api")
app.include_router(users.router, prefix="/api")
app.include_router(residents.router, prefix="/api")
app.include_router(announcements.router, prefix="/api")
app.include_router(feedback.router, prefix="/api")
app.include_router(dashboard.router, prefix="/api")
app.include_router(reports.router, prefix="/api")
app.include_router(activity.router, prefix="/api")
app.include_router(settings_router.router, prefix="/api")
app.include_router(detection.router, prefix="/api")
app.include_router(websocket.router, prefix="/api")
app.include_router(backup.router, prefix="/api")
app.include_router(roles.router, prefix="/api")


@app.post("/api/users/heartbeat")
def user_heartbeat(
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user)
):
    current_user.last_seen = datetime.now(timezone.utc)
    db.commit()
    return {"status": "ok", "last_seen": current_user.last_seen}


@app.post("/api/notifications/garbage-truck")
async def receive_garbage_truck_notification(
    payload: dict,
    request: Request,
    authorization: str = Header(None),
    db: Session = Depends(get_db),
):
    token = authorization.replace("Bearer ", "") if authorization else ""
    if token != settings.DETECTOR_API_KEY:
        raise HTTPException(status_code=401, detail="Invalid detector API key")

    print(f"[Garbage-Truck] Payload received: {payload}")

    status_val = payload.get("status", "").upper()
    if status_val not in ("PRESENT", "DEPARTED"):
        raise HTTPException(status_code=400, detail="status must be 'PRESENT' or 'DEPARTED'")

    event_type = "truck_present" if status_val == "PRESENT" else "truck_departed"

    from app.routers.websocket import process_detection_event, camera_states

    camera_id = payload.get("camera_id")
    camera_name = payload.get("camera_name")
    confidence = payload.get("confidence", 0.0)

    if not confidence and camera_id and camera_id in camera_states:
        confidence = camera_states[camera_id].get("confidence", 0.0)

    # Get client IP from request
    forwarded_for = request.headers.get("x-forwarded-for")
    if forwarded_for:
        client_ip = forwarded_for.split(",")[0].strip()
    else:
        client_ip = request.client.host if request.client else "unknown"

    broadcast = process_detection_event({
        "event_type": event_type,
        "camera_id": camera_id,
        "camera_name": camera_name,
        "confidence": confidence,
        "image_path": None,
    }, client_ip=client_ip)

    if broadcast:
        from app.services.websocket_manager import manager
        await manager.broadcast(broadcast)

    return {"status": "ok", "event_type": event_type}


@app.get("/")
def root():
    return {"message": "Vision-Trak Backend is running", "docs": "/docs"}