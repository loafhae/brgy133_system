# app/utils/audit.py
import anyio
from datetime import datetime
from sqlalchemy.orm import Session
from app.models.audit import AuditLog
from app.models.user import User

# 🔑 Import the single true shared connection manager instance
from app.routers.websocket_manager import manager 

# Human-readable label mappings matching your activity.py router mapping
ACTIVITY_MAPPING = {
    "submit_feedback": "Feedback Submitted",
    "login": "Login",
    "change_password": "Password Changed",
    "upload_avatar": "Profile Picture Updated",
    "update_profile": "Profile Updated"
}

def log_user_activity(
    db: Session,
    user_id: int,
    action_type: str,
    target_table: str,
    target_id: int,
    description: str,
    ip_address: str = None,
    request = None 
):
    """
    Logs user operational states to the database and broadcasts 
    them instantly to the React Web Dashboard over the unified WebSocket pool.
    """
    # Extract the client IP from the FastAPI Request object if it wasn't passed directly
    if request and not ip_address:
        try:
            ip_address = request.client.host
        except Exception:
            pass

    # 1. Standard database transaction write
    audit_log = AuditLog(
        user_id=user_id,
        action_type=action_type,
        target_table=target_table,
        target_id=target_id,
        description=description,
        ip_address=ip_address,
    )
    db.add(audit_log)
    db.commit()
    db.refresh(audit_log)
    
    # 2. Extract user data to attach a display username for the React DataGrid rows
    username = f"User #{user_id}"
    if user_id:
        user_record = db.query(User).filter(User.user_id == user_id).first()
        if user_record:
            username = user_record.username
    else:
        username = "System" 

    # 3. Format the dynamic data payload structure to match your React requirements
    live_log_payload = {
        "ws_type": "activity_log", # Key flag so only the Activity page consumes this message
        "log_id": audit_log.log_id,
        "user_id": user_id,
        "username": username,
        "action_type": ACTIVITY_MAPPING.get(action_type, action_type.replace("_", " ").title()),
        "description": description,
        "timestamp": str(audit_log.timestamp) if audit_log.timestamp else str(datetime.now()),
        "status": "Success"
    }

    # 4. ⚡ Securely bridge execution from synchronous worker pools back to the main ASGI thread loop
    try:
        anyio.from_thread.run(manager.broadcast, live_log_payload)
    except Exception as e:
        print(f"[Audit Broadcast Error] Failed to stream live record object: {e}")