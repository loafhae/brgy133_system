import os, shutil, uuid
from fastapi import APIRouter, Depends, HTTPException, status, Query, Form, UploadFile, File, Request
from sqlalchemy.orm import Session
from datetime import datetime
from typing import Optional
from firebase_admin import messaging
from app.database import get_db
from app.dependencies import require_role
from app.models.user import User, Resident
from app.models.announcement import Announcement
from app.models.detection import Notification
from app.schemas.announcement import AnnouncementCreate, AnnouncementUpdate, AnnouncementResponse

UPLOAD_DIR = "uploads/announcements"
os.makedirs(UPLOAD_DIR, exist_ok=True)

# 🛑 Fixed: Removed redundant "/api" since main.py already prepends it
router = APIRouter(prefix="/announcements", tags=["announcements"])


@router.get("", response_model=list[AnnouncementResponse])
def list_announcements(
    search: Optional[str] = None,
    published_only: bool = False,
    page: int = Query(1, ge=1),
    limit: int = Query(20, ge=1, le=100),
    db: Session = Depends(get_db),
    current_user: User = Depends(require_role("super_admin", "official", "resident")),
):
    query = db.query(Announcement)
    if published_only:
        query = query.filter(Announcement.is_published == True)
    if search:
        query = query.filter(Announcement.title.ilike(f"%{search}%"))
    announcements = query.order_by(Announcement.date_posted.desc(), Announcement.announcement_id.desc()).offset((page - 1) * limit).limit(limit).all()
    return announcements


@router.get("/public", response_model=list[AnnouncementResponse])
def list_public_announcements(
    limit: int = Query(6, ge=1, le=20),
    db: Session = Depends(get_db),
):
    """Public announcements for the landing page bulletin"""
    return db.query(Announcement).filter(Announcement.is_published == True).order_by(Announcement.date_posted.desc()).limit(limit).all()


@router.get("/{announcement_id}", response_model=AnnouncementResponse)
def get_announcement(
    announcement_id: int,
    db: Session = Depends(get_db),
    current_user: User = Depends(require_role("super_admin", "official", "resident")),
):
    announcement = db.query(Announcement).filter(Announcement.announcement_id == announcement_id).first()
    if not announcement:
        raise HTTPException(status_code=404, detail="Announcement not found")
    return announcement


@router.post("", response_model=AnnouncementResponse, status_code=status.HTTP_201_CREATED)
async def create_announcement(
    request: Request,
    db: Session = Depends(get_db),
    current_user: User = Depends(require_role("super_admin", "official")),
):
    content_type = request.headers.get("content-type", "")
    attachment_path: Optional[str] = None
    if "application/json" in content_type:
        body = await request.json()
        title_val = body.get("title")
        content_val = body.get("content")
        title = str(title_val) if title_val is not None else None
        content = str(content_val) if content_val is not None else None
        is_published = body.get("is_published", True)
    else:
        form = await request.form()
        title_raw = form.get("title")
        title = str(title_raw) if title_raw is not None and not isinstance(title_raw, UploadFile) else None
        content_raw = form.get("content")
        content = str(content_raw) if content_raw is not None and not isinstance(content_raw, UploadFile) else None
        is_pub_raw = form.get("is_published", "true")
        is_published = is_pub_raw in (True, "true", "True", "1", 1)
        attachment = form.get("attachment")
        if isinstance(attachment, UploadFile) and attachment.filename:
            ext = os.path.splitext(attachment.filename)[1].lower()
            if ext not in [".jpg", ".jpeg", ".png", ".webp", ".pdf", ".doc", ".docx"]:
                raise HTTPException(status_code=400, detail="Allowed attachment formats: JPG, PNG, WebP, PDF, DOC, DOCX")
            fname = f"{uuid.uuid4().hex}{ext}"
            fpath = os.path.join(UPLOAD_DIR, fname)
            with open(fpath, "wb") as f:
                shutil.copyfileobj(attachment.file, f)
            attachment_path = f"/uploads/announcements/{fname}"

    if not title or not content:
        raise HTTPException(status_code=400, detail="Title and content are required.")

    announcement = Announcement(
        created_by=current_user.user_id,
        title=title,
        content=content,
        is_published=bool(is_published),
        date_posted=datetime.now(),
        attachment_path=attachment_path,
    )
    db.add(announcement)
    db.flush()

    if is_published:
        notif = Notification(
            notification_type="announcement",
            title=f"Barangay Announcement: {title}",
            message=f"Barangay Announcement: {title}",
            status="pending",
            target_group="residents",
        )
        db.add(notif)

        residents_with_tokens = db.query(Resident).filter(Resident.fcm_token != None).all()
        tokens = [r.fcm_token for r in residents_with_tokens if r.fcm_token]

        if tokens:
            message = messaging.MulticastMessage(
                notification=messaging.Notification(
                    title=f"New Announcement: {title}",
                    body=content,
                ),
                tokens=tokens,
            )
            try:
                response = messaging.send_each_for_multicast(message)
                print(f"Successfully sent FCM announcements: {response.success_count} success, {response.failure_count} failures")
            except Exception as e:
                print(f"Failed to send FCM notifications: {e}")

    db.commit()
    db.refresh(announcement)
    return announcement


@router.put("/{announcement_id}", response_model=AnnouncementResponse)
async def update_announcement(
    announcement_id: int,
    request: Request,
    db: Session = Depends(get_db),
    current_user: User = Depends(require_role("super_admin", "official")),
):
    announcement = db.query(Announcement).filter(Announcement.announcement_id == announcement_id).first()
    if not announcement:
        raise HTTPException(status_code=404, detail="Announcement not found")

    content_type = request.headers.get("content-type", "")
    if "application/json" in content_type:
        body = await request.json()
        if "title" in body and body["title"] is not None:
            announcement.title = str(body["title"])
        if "content" in body and body["content"] is not None:
            announcement.content = str(body["content"])
        if "is_published" in body:
            announcement.is_published = bool(body["is_published"])
    else:
        form = await request.form()
        if "title" in form:
            val = form.get("title")
            if isinstance(val, str):
                announcement.title = val
        if "content" in form:
            val = form.get("content")
            if isinstance(val, str):
                announcement.content = val
        if "is_published" in form:
            is_pub_raw = form.get("is_published")
            announcement.is_published = is_pub_raw in (True, "true", "True", "1", 1)
        attachment = form.get("attachment")
        if isinstance(attachment, UploadFile) and attachment.filename:
            ext = os.path.splitext(attachment.filename)[1].lower()
            if ext not in [".jpg", ".jpeg", ".png", ".webp", ".pdf", ".doc", ".docx"]:
                raise HTTPException(status_code=400, detail="Allowed attachment formats: JPG, PNG, WebP, PDF, DOC, DOCX")
            if announcement.attachment_path:
                old_path = announcement.attachment_path.lstrip("/")
                if os.path.exists(old_path):
                    os.remove(old_path)
            fname = f"{uuid.uuid4().hex}{ext}"
            fpath = os.path.join(UPLOAD_DIR, fname)
            with open(fpath, "wb") as f:
                shutil.copyfileobj(attachment.file, f)
            announcement.attachment_path = f"/uploads/announcements/{fname}"

    db.commit()
    db.refresh(announcement)
    return announcement


@router.delete("/{announcement_id}", status_code=status.HTTP_204_NO_CONTENT)
def delete_announcement(
    announcement_id: int,
    db: Session = Depends(get_db),
    current_user: User = Depends(require_role("super_admin", "official")),
):
    announcement = db.query(Announcement).filter(Announcement.announcement_id == announcement_id).first()
    if not announcement:
        raise HTTPException(status_code=404, detail="Announcement not found")
    db.delete(announcement)
    db.commit()
    return None