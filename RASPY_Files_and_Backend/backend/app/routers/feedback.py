import json
import logging
import uuid
from pathlib import Path
from typing import List
from fastapi import APIRouter, Depends, File, Form, HTTPException, Request, status, Query, UploadFile
from fastapi.responses import FileResponse
from sqlalchemy.orm import Session, joinedload
from datetime import datetime
import asyncio
from typing import Optional
from app.database import get_db
from app.dependencies import require_role, get_current_user
from app.models.user import User
from app.models.audit import AuditLog
from app.models.feedback import Feedback
from app.paths import FEEDBACK_UPLOAD_DIR
from app.schemas.feedback import FeedbackCreate, FeedbackUpdate, FeedbackResponse, FeedbackAttachmentResponse
from app.services.websocket_manager import manager

router = APIRouter(prefix="/feedback", tags=["feedback"])
logger = logging.getLogger(__name__)

MAX_ATTACHMENTS = 10
MAX_ATTACHMENT_SIZE = 10 * 1024 * 1024
ALLOWED_FILE_TYPES = {
    ".jpg": ("image/jpeg", lambda data: data.startswith(b"\xff\xd8\xff")),
    ".jpeg": ("image/jpeg", lambda data: data.startswith(b"\xff\xd8\xff")),
    ".png": ("image/png", lambda data: data.startswith(b"\x89PNG\r\n\x1a\n")),
    ".webp": ("image/webp", lambda data: data.startswith(b"RIFF") and data[8:12] == b"WEBP"),
    ".pdf": ("application/pdf", lambda data: data.startswith(b"%PDF-")),
}


def attachment_responses(feedback: Feedback) -> list[FeedbackAttachmentResponse]:
    if not feedback.attachments:
        return []
    return [
        FeedbackAttachmentResponse(
            attachment_id=item["attachment_id"],
            original_filename=item["original_filename"],
            mime_type=item["mime_type"],
            file_size=item["file_size"],
        )
        for item in json.loads(feedback.attachments)
    ]


def feedback_response(feedback: Feedback, username: str) -> FeedbackResponse:
    return FeedbackResponse(
        feedback_id=feedback.feedback_id,
        created_by=feedback.created_by,
        username=username,
        subject=feedback.subject,
        content=feedback.content,
        timestamp=feedback.timestamp,
        attachment_path=feedback.attachment_path,
        attachments=attachment_responses(feedback),
        is_resolved=feedback.is_resolved,
        resolved_at=feedback.resolved_at,
    )


def read_validated_uploads(files: list[UploadFile]) -> list[tuple[UploadFile, bytes, str]]:
    if len(files) > MAX_ATTACHMENTS:
        raise HTTPException(status_code=400, detail=f"Maximum {MAX_ATTACHMENTS} attachments allowed.")

    validated = []
    for upload in files:
        if not upload.filename:
            continue
        extension = Path(upload.filename).suffix.lower()
        file_type = ALLOWED_FILE_TYPES.get(extension)
        if file_type is None:
            raise HTTPException(status_code=400, detail="Only JPG, PNG, WebP, and PDF attachments are allowed.")
        content = upload.file.read(MAX_ATTACHMENT_SIZE + 1)
        if len(content) > MAX_ATTACHMENT_SIZE:
            raise HTTPException(status_code=413, detail="Each attachment must be 10 MB or smaller.")
        mime_type, signature_check = file_type
        if not signature_check(content):
            raise HTTPException(status_code=400, detail=f"File content does not match {upload.filename}.")
        validated.append((upload, content, mime_type))
    return validated

@router.get("", response_model=list[FeedbackResponse])
def list_feedback(
    search: Optional[str] = None,
    page: int = Query(1, ge=1),
    limit: int = Query(20, ge=1, le=100),
    db: Session = Depends(get_db),
    current_user: User = Depends(require_role("official")),
):
    query = db.query(Feedback).options(joinedload(Feedback.author))
    if search:
        query = query.filter(Feedback.subject.ilike(f"%{search}%"))
    feedbacks = query.order_by(Feedback.timestamp.desc()).offset((page - 1) * limit).limit(limit).all()
    return [
        feedback_response(f, f.author.username if f.author else "Unknown")
        for f in feedbacks
    ]


@router.get("/{feedback_id}", response_model=FeedbackResponse)
def get_feedback(
    feedback_id: int,
    db: Session = Depends(get_db),
    current_user: User = Depends(require_role("official")),
):
    feedback = db.query(Feedback).options(joinedload(Feedback.author)).filter(Feedback.feedback_id == feedback_id).first()
    if not feedback:
        raise HTTPException(status_code=404, detail="Feedback not found")
    return feedback_response(feedback, feedback.author.username if feedback.author else "Unknown")


@router.get("/{feedback_id}/attachments/{attachment_id}")
def get_feedback_attachment(
    feedback_id: int,
    attachment_id: str,
    db: Session = Depends(get_db),
    current_user: User = Depends(require_role("official", "super_admin")),
):
    feedback = db.query(Feedback).filter(Feedback.feedback_id == feedback_id).first()
    if not feedback or not feedback.attachments:
        raise HTTPException(status_code=404, detail="Attachment not found")
    attachment = next(
        (item for item in json.loads(feedback.attachments) if item["attachment_id"] == attachment_id),
        None,
    )
    if attachment is None:
        raise HTTPException(status_code=404, detail="Attachment not found")

    file_path = (FEEDBACK_UPLOAD_DIR / attachment["storage_name"]).resolve()
    if file_path.parent != FEEDBACK_UPLOAD_DIR.resolve() or not file_path.is_file():
        raise HTTPException(status_code=404, detail="Attachment file not found")
    return FileResponse(
        file_path,
        media_type=attachment["mime_type"],
        filename=attachment["original_filename"],
        content_disposition_type="inline",
    )


@router.post("", response_model=FeedbackResponse, status_code=status.HTTP_201_CREATED)
def submit_feedback(
    body: FeedbackCreate,
    request: Request,
    db: Session = Depends(get_db),
    current_user: User = Depends(require_role("resident")),
):
    feedback = Feedback(
        created_by=current_user.user_id,
        subject=body.subject,
        content=body.content,
    )
    db.add(feedback)
    db.flush()
    db.add(AuditLog(
        user_id=current_user.user_id,
        action_type="feedback_submitted",
        target_table="tbl_feedback",
        target_id=feedback.feedback_id,
        description="Submitted feedback",
        ip_address=getattr(request.state, "client_ip", None),
    ))
    db.commit()
    db.refresh(feedback)

    response = feedback_response(feedback, current_user.username)

    try:
        event = {
            "event": "new_feedback",
            "feedback": {
                "feedback_id": feedback.feedback_id,
                "username": current_user.username,
                "subject": feedback.subject,
                "content": feedback.content,
                "timestamp": str(feedback.timestamp) if feedback.timestamp else None,
            },
        }
        loop = asyncio.get_event_loop()
        if loop.is_running():
            asyncio.ensure_future(manager.broadcast(event))
        else:
            loop.run_until_complete(manager.broadcast(event))
    except Exception:
        pass

    return response


@router.post("/with-attachments", response_model=FeedbackResponse, status_code=status.HTTP_201_CREATED)
def submit_feedback_with_attachments(
    request: Request,
    subject: str = Form(...),
    content: str = Form(...),
    files: List[UploadFile] = File(default=[]),
    db: Session = Depends(get_db),
    current_user: User = Depends(require_role("resident")),
):
    if not subject.strip() or not content.strip():
        raise HTTPException(status_code=422, detail="Subject and message are required.")

    uploads = read_validated_uploads(files)
    feedback = Feedback(
        created_by=current_user.user_id,
        subject=subject,
        content=content,
    )
    db.add(feedback)
    db.flush()

    saved_paths = []
    attachment_data = []
    try:
        FEEDBACK_UPLOAD_DIR.mkdir(parents=True, exist_ok=True)
        for upload, data, mime_type in uploads:
            attachment_id = uuid.uuid4().hex
            extension = Path(upload.filename).suffix.lower()
            storage_name = f"{attachment_id}{extension}"
            file_path = FEEDBACK_UPLOAD_DIR / storage_name
            file_path.write_bytes(data)
            saved_paths.append(file_path)
            attachment_data.append({
                "attachment_id": attachment_id,
                "storage_name": storage_name,
                "original_filename": Path(upload.filename).name,
                "mime_type": mime_type,
                "file_size": len(data),
            })

        feedback.attachments = json.dumps(attachment_data) if attachment_data else None
        db.add(AuditLog(
            user_id=current_user.user_id,
            action_type="feedback_submitted",
            target_table="tbl_feedback",
            target_id=feedback.feedback_id,
            description="Submitted feedback",
            ip_address=getattr(request.state, "client_ip", None),
        ))
        db.commit()
        db.refresh(feedback)
    except Exception:
        db.rollback()
        for file_path in saved_paths:
            file_path.unlink(missing_ok=True)
        raise
    finally:
        for upload in files:
            upload.file.close()

    response = feedback_response(feedback, current_user.username)
    try:
        event = {
            "event": "new_feedback",
            "feedback": {
                "feedback_id": feedback.feedback_id,
                "username": current_user.username,
                "subject": feedback.subject,
                "content": feedback.content,
                "timestamp": str(feedback.timestamp) if feedback.timestamp else None,
            },
        }
        loop = asyncio.get_event_loop()
        if loop.is_running():
            asyncio.ensure_future(manager.broadcast(event))
        else:
            loop.run_until_complete(manager.broadcast(event))
    except Exception:
        pass
    return response


@router.patch("/{feedback_id}")
def resolve_feedback(
    feedback_id: int,
    body: FeedbackUpdate,
    db: Session = Depends(get_db),
    current_user: User = Depends(require_role("official")),
):
    feedback = db.query(Feedback).filter(Feedback.feedback_id == feedback_id).first()
    if not feedback:
        raise HTTPException(status_code=404, detail="Feedback not found")
    feedback.is_resolved = 1 if body.is_resolved else 0
    feedback.resolved_at = datetime.now() if body.is_resolved else None
    db.commit()
    db.refresh(feedback)
    return feedback_response(feedback, feedback.author.username if feedback.author else "Unknown")


@router.delete("/{feedback_id}", status_code=status.HTTP_204_NO_CONTENT)
def delete_feedback(
    feedback_id: int,
    db: Session = Depends(get_db),
    current_user: User = Depends(require_role("official")),
):
    feedback = db.query(Feedback).filter(Feedback.feedback_id == feedback_id).first()
    if not feedback:
        raise HTTPException(status_code=404, detail="Feedback not found")
    stored_names = [
        item["storage_name"]
        for item in json.loads(feedback.attachments or "[]")
    ]
    db.delete(feedback)
    db.commit()
    for stored_name in stored_names:
        file_path = (FEEDBACK_UPLOAD_DIR / stored_name).resolve()
        if file_path.parent == FEEDBACK_UPLOAD_DIR.resolve():
            try:
                file_path.unlink(missing_ok=True)
            except OSError:
                logger.exception("Could not remove feedback attachment %s", stored_name)
    return None