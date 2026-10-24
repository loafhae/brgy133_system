import os
import ipaddress
import json
from contextlib import asynccontextmanager
from datetime import datetime, timezone
from fastapi import FastAPI, Depends, HTTPException, Request, status
from fastapi.responses import FileResponse, RedirectResponse
from fastapi.middleware.cors import CORSMiddleware
from fastapi.staticfiles import StaticFiles
from sqlalchemy import text
from sqlalchemy.orm import Session

import firebase_admin
from firebase_admin import credentials

from app.config import settings, validate_deployment_settings
from app.database import engine, Base, get_db
from app.paths import ANNOUNCEMENT_UPLOAD_DIR, DETECTION_UPLOAD_DIR, PROFILE_PIC_DIR
from app.models import (
    User, Resident,
    DetectionLog, Notification,
    Announcement, Feedback, Report,
    SystemSetting, AuditLog, UserSession,
)
from app.services.resident_migration import migrate_resident_schema, migrate_gender_schema
from app.dependencies import get_current_user, require_detector_key, session_cookie_name
from app.middleware.ip_logger import IPLoggerMiddleware
from app.middleware.rate_limiter import RateLimiterMiddleware

from app.routers import (
    auth, users, residents, announcements,
    feedback, dashboard, reports, activity,
    settings as settings_router, detection, websocket, backup,
)


def check_database_connection():
    try:
        with engine.connect() as conn:
            conn.execute(text("SELECT 1"))
            print(f"[OK] Database '{settings.DATABASE_NAME}' is ready.")
    except Exception as e:
        raise RuntimeError(
            f"Could not connect to database '{settings.DATABASE_NAME}'. "
            "Verify the database exists and the configured account has access."
        ) from e


@asynccontextmanager
async def lifespan(app: FastAPI):
    validate_deployment_settings()
    check_database_connection()
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

    migrate_resident_schema(engine)
    migrate_gender_schema(engine)

    try:
        with engine.connect() as conn:
            conn.execute(text("ALTER TABLE tbl_feedback ADD COLUMN `attachments` TEXT NULL"))
            conn.commit()
    except Exception:
        pass

    try:
        with engine.connect() as conn:
            conn.execute(text("ALTER TABLE tbl_detectionlog ADD COLUMN `event_type` VARCHAR(50) NULL"))
            conn.commit()
    except Exception:
        pass

    yield


app = FastAPI(
    title="Vision-Trak Backend",
    description="Multi-Platform Barangay Announcement and Garbage Collection Notifier API",
    version="1.0.0",
    docs_url=None,
    redoc_url=None,
    openapi_url=None,
    lifespan=lifespan,
)

# Security Headers Middleware
@app.middleware("http")
async def add_security_headers(request: Request, call_next):
    forwarded_proto = request.headers.get("x-forwarded-proto", "").split(",", 1)[0].strip().lower()
    cf_visitor = request.headers.get("cf-visitor")
    try:
        cloudflare_scheme = json.loads(cf_visitor).get("scheme") if cf_visitor else None
    except (json.JSONDecodeError, AttributeError):
        cloudflare_scheme = None
    is_cf = bool(request.headers.get("cf-ray"))
    is_https = request.url.scheme == "https" or forwarded_proto == "https" or cloudflare_scheme == "https" or is_cf

    hostname = request.url.hostname or ""
    is_local = hostname.lower() in {"localhost", "testserver"}
    try:
        is_local = is_local or ipaddress.ip_address(hostname).is_private or ipaddress.ip_address(hostname).is_loopback
    except ValueError:
        pass
    if settings.REQUIRE_HTTPS and not is_https and not is_local:
        return RedirectResponse(
            url=str(request.url.replace(scheme="https")),
            status_code=status.HTTP_308_PERMANENT_REDIRECT,
        )

    response = await call_next(request)
    if (
        response.status_code == status.HTTP_401_UNAUTHORIZED
        and request.cookies.get(session_cookie_name())
        and request.url.path != "/api/auth/login"
    ):
        response.delete_cookie(
            key=session_cookie_name(),
            httponly=True,
            secure=settings.SESSION_COOKIE_SECURE,
            samesite="lax",
            path="/",
        )
    response.headers["X-Content-Type-Options"] = "nosniff"
    response.headers["X-Frame-Options"] = "SAMEORIGIN"
    response.headers["X-XSS-Protection"] = "1; mode=block"
    response.headers["Referrer-Policy"] = "strict-origin-when-cross-origin"
    if request.url.path.startswith("/api/"):
        response.headers["Cache-Control"] = "no-store"
        response.headers["Pragma"] = "no-cache"
    if is_https:
        response.headers["Strict-Transport-Security"] = "max-age=31536000"
    return response

# Hardened CORS policy (Single-Origin & Local Development)
app.add_middleware(
    CORSMiddleware,
    allow_origins=settings.CORS_ORIGINS_LIST,
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# IP Logger middleware for audit logging
app.add_middleware(IPLoggerMiddleware)

# Rate Limiter & Abuse Prevention middleware
app.add_middleware(RateLimiterMiddleware)

for _upload_name, _upload_dir in (
    ("announcements", ANNOUNCEMENT_UPLOAD_DIR),
    ("detections", DETECTION_UPLOAD_DIR),
    ("profile_pics", PROFILE_PIC_DIR),
):
    app.mount(
        f"/uploads/{_upload_name}",
        StaticFiles(directory=str(_upload_dir)),
        name=f"uploads-{_upload_name}",
    )

_legacy_profile_dir = PROFILE_PIC_DIR.parent / "profiles"
if _legacy_profile_dir.exists():
    app.mount(
        "/uploads/profiles",
        StaticFiles(directory=str(_legacy_profile_dir)),
        name="uploads-profiles",
    )

# All routers u1se prefix="/api"
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


@app.get("/healthz")
def health_check():
    return {"status": "ok"}


@app.get("/download/app")
@app.get("/api/download/app")
def download_mobile_app():
    apk_paths = [
        os.path.join(os.path.dirname(os.path.dirname(os.path.dirname(os.path.abspath(__file__)))), "frontend", "frontend-react", "public", "visiontrak.apk"),
        os.path.join(os.path.dirname(os.path.dirname(os.path.dirname(os.path.abspath(__file__)))), "frontend", "flutter_app", "build", "app", "outputs", "flutter-apk", "app-release.apk"),
    ]
    for p in apk_paths:
        if os.path.exists(p):
            return FileResponse(
                p,
                media_type="application/vnd.android.package-archive",
                filename="VisionTrak_Barangay133.apk"
            )
    raise HTTPException(status_code=404, detail="Mobile application package is currently being generated. Please contact the Barangay Hall.")


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
    db: Session = Depends(get_db),
    _: None = Depends(require_detector_key),
):
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


# ---- FRONTEND SPA SERVING & FALLBACK ----
_dist_dir = os.path.join(
    os.path.dirname(os.path.dirname(os.path.dirname(os.path.abspath(__file__)))),
    "frontend",
    "frontend-react",
    "dist",
)

if os.path.exists(_dist_dir):
    _assets_dir = os.path.join(_dist_dir, "assets")
    if os.path.exists(_assets_dir):
        app.mount("/assets", StaticFiles(directory=_assets_dir), name="frontend-assets")

    @app.get("/{full_path:path}")
    async def serve_spa(full_path: str, request: Request):
        # Exclude reserved backend paths
        if full_path.startswith(("api", "uploads", "snapshots", "docs", "openapi.json", "redoc")):
            raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Resource Not Found")

        if not full_path and ("text/html" not in request.headers.get("accept", "") or "application/json" in request.headers.get("accept", "")):
            return {"message": "Vision-Trak Backend is running", "health": "/healthz"}

        if full_path:
            dist_root = os.path.realpath(_dist_dir)
            file_path = os.path.realpath(os.path.join(dist_root, full_path))
            if os.path.commonpath([dist_root, file_path]) == dist_root and os.path.isfile(file_path):
                return FileResponse(file_path)

        index_file = os.path.join(_dist_dir, "index.html")
        if os.path.exists(index_file):
            return FileResponse(
                index_file,
                headers={"Cache-Control": "no-cache, no-store, must-revalidate"}
            )
        return {"message": "Vision-Trak Unified Gateway is running", "health": "/healthz"}
else:
    @app.get("/")
    def root():
        return {"message": "Vision-Trak Backend is running", "health": "/healthz"}