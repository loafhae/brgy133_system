import os, shutil, uuid
from fastapi import APIRouter, Depends, HTTPException, status, Query, Form, UploadFile, File
from sqlalchemy.orm import Session
from typing import Optional
from app.database import get_db
from app.dependencies import require_role
from app.models.user import User
from app.models.announcement import Announcement
from app.models.detection import Notification
from app.schemas.announcement import AnnouncementCreate, AnnouncementUpdate, AnnouncementResponse

UPLOAD_DIR = "uploads/announcements"
os.makedirs(UPLOAD_DIR, exist_ok=True)

router = APIRouter(prefix="/api/announcements", tags=["announcements"])


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
    announcements = query.order_by(Announcement.date_posted.desc()).offset((page - 1) * limit).limit(limit).all()
    return announcements


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
def create_announcement(
    title: str = Form(...),
    content: str = Form(...),
    is_published: bool = Form(True),
    attachment: Optional[UploadFile] = File(None),
    db: Session = Depends(get_db),
    current_user: User = Depends(require_role("super_admin", "official")),
):
    attachment_path = None
    if attachment and attachment.filename:
        ext = os.path.splitext(attachment.filename)[1]
        fname = f"{uuid.uuid4().hex}{ext}"
        fpath = os.path.join(UPLOAD_DIR, fname)
        with open(fpath, "wb") as f:
            shutil.copyfileobj(attachment.file, f)
        attachment_path = f"/uploads/announcements/{fname}"

    announcement = Announcement(
        created_by=current_user.user_id,
        title=title,
        content=content,
        is_published=is_published,
        attachment_path=attachment_path,
    )
    db.add(announcement)
    db.flush()

    if is_published:
        notif = Notification(
            notification_type="announcement",
            title="New Announcement",
            message=title,
            status="pending",
            target_group="residents",
        )
        db.add(notif)

    db.commit()
    db.refresh(announcement)
    return announcement


@router.put("/{announcement_id}", response_model=AnnouncementResponse)
def update_announcement(
    announcement_id: int,
    title: Optional[str] = Form(None),
    content: Optional[str] = Form(None),
    is_published: Optional[bool] = Form(None),
    attachment: Optional[UploadFile] = File(None),
    db: Session = Depends(get_db),
    current_user: User = Depends(require_role("super_admin", "official")),
):
    announcement = db.query(Announcement).filter(Announcement.announcement_id == announcement_id).first()
    if not announcement:
        raise HTTPException(status_code=404, detail="Announcement not found")

    if title is not None:
        announcement.title = title
    if content is not None:
        announcement.content = content
    if is_published is not None:
        announcement.is_published = is_published
    if attachment and attachment.filename:
        if announcement.attachment_path:
            old_path = announcement.attachment_path.lstrip("/")
            if os.path.exists(old_path):
                os.remove(old_path)
        ext = os.path.splitext(attachment.filename)[1]
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
