import json
import time
from datetime import datetime
from fastapi import APIRouter, WebSocket, WebSocketDisconnect
from app.services.websocket_manager import manager
from app.database import SessionLocal
from app.models.detection import DetectionLog, Notification
from app.models.audit import AuditLog

router = APIRouter(tags=["websocket"])

from datetime import timedelta
from app.models.settings import SystemSetting

R_PRES = 100
R_MISS = 60
DEFAULT_CAMERAS = {
    1: "Cam 1 - Delivery Area",
    2: "Cam 2 - Loading Bay",
    3: "Cam 3 - Exit Gate",
}

camera_states = {}
focused_camera_id = None
active_camera_id = None
last_event_time = 0
_last_notification_time = None


def _ensure_cameras():
    for cid, cname in DEFAULT_CAMERAS.items():
        if cid not in camera_states:
            camera_states[cid] = {
                "name": cname,
                "active": cid == active_camera_id,
                "locked": cid == focused_camera_id,
                "truck_in_zone": False,
                "consecutive_present": 0,
                "consecutive_missing": 0,
                "has_motion": False,
                "confidence": 0.0,
            }


@router.get("/status")
def get_status():
    _ensure_cameras()

    cameras = []
    for cid in sorted(camera_states.keys()):
        s = camera_states[cid]
        cameras.append({
            "name": s["name"],
            "active": s["active"],
            "locked": s["locked"],
            "truck_in_zone": s["truck_in_zone"],
            "consecutive_present": s["consecutive_present"],
            "consecutive_missing": s["consecutive_missing"],
            "has_motion": s["has_motion"],
            "confidence": s["confidence"],
        })

    active_idx = None
    focused_idx = None
    for i, cid in enumerate(sorted(camera_states.keys())):
        if camera_states[cid]["active"]:
            active_idx = i
        if camera_states[cid]["locked"]:
            focused_idx = i

    return {
        "cameras": cameras,
        "active_idx": active_idx,
        "focused_idx": focused_idx,
        "fps": 15,
    }


def _get_cooldown_seconds(db) -> int:
    try:
        setting = db.query(SystemSetting).filter(
            SystemSetting.config_key == "notification_cooldown"
        ).first()
        return int(setting.config_value) if setting else 300
    except Exception:
        return 300


def _should_send_notification(db) -> bool:
    global _last_notification_time
    cooldown = _get_cooldown_seconds(db)
    if _last_notification_time is None:
        return True
    elapsed = time.time() - _last_notification_time
    return elapsed >= cooldown


def process_detection_event(payload):
    global focused_camera_id, active_camera_id, last_event_time, _last_notification_time

    event_type = payload.get("event_type", "unknown")
    camera_id = payload.get("camera_id", 0)
    camera_name = payload.get("camera_name", f"Cam {camera_id}")
    confidence = payload.get("confidence", 0.0)
    image_path = payload.get("image_path")
    now_str = datetime.now().strftime("%Y-%m-%d %H:%M:%S")
    now_ts = time.time()

    if event_type == "scan_start":
        active_camera_id = camera_id
        _ensure_cameras()
        for cid in camera_states:
            camera_states[cid]["active"] = (cid == camera_id)
        return None

    if event_type == "camera_switched":
        active_camera_id = camera_id
        _ensure_cameras()
        for cid in camera_states:
            camera_states[cid]["active"] = (cid == camera_id)
        return None

    if event_type not in ("truck_present", "truck_departed"):
        return None

    _ensure_cameras()
    last_event_time = now_ts

    db = SessionLocal()
    try:
        if event_type == "truck_present":
            cam = camera_states.get(camera_id)
            if cam is None:
                camera_states[camera_id] = {
                    "name": camera_name,
                    "active": camera_id == active_camera_id,
                    "locked": False,
                    "truck_in_zone": True,
                    "consecutive_present": 1,
                    "consecutive_missing": 0,
                    "has_motion": True,
                    "confidence": confidence,
                }
            else:
                cam["truck_in_zone"] = True
                cam["consecutive_present"] += 1
                cam["consecutive_missing"] = 0
                cam["has_motion"] = True
                cam["confidence"] = confidence
                cam["active"] = (camera_id == active_camera_id)

            if not focused_camera_id or focused_camera_id != camera_id:
                focused_camera_id = camera_id
            camera_states[camera_id]["locked"] = True
            for cid in camera_states:
                if cid != camera_id:
                    camera_states[cid]["locked"] = False

            log = DetectionLog(
                confidence_score=confidence,
                image_path=image_path,
                camera_id=camera_id,
                camera_name=camera_name,
                notification_status="sent",
            )
            db.add(log)
            db.flush()

            notif = None
            if _should_send_notification(db):
                notif = Notification(
                    log_id=log.log_id,
                    notification_type="detection",
                    title="Garbage Truck Detected",
                    message="The garbage truck is now in your area. Please prepare your waste for collection.",
                    status="sent",
                    sent_at=datetime.now(),
                    target_group="residents",
                )
                db.add(notif)
                _last_notification_time = time.time()

            audit = AuditLog(
                user_id=None,
                action_type="truck_present",
                target_table="tbl_DetectionLog",
                target_id=log.log_id,
                description=f"Truck detected at {camera_name} (confidence={confidence})",
            )
            db.add(audit)
            db.commit()

            return _build_broadcast(event_type, camera_id, camera_name, confidence,
                                    log.log_id, notif.notification_id if notif else None,
                                    image_path, now_str,
                                    f"Garbage truck DETECTED at {camera_name} — LOCKED ON")

        elif event_type == "truck_departed":
            cam = camera_states.get(camera_id)
            if cam is None:
                camera_states[camera_id] = {
                    "name": camera_name,
                    "active": camera_id == active_camera_id,
                    "locked": False,
                    "truck_in_zone": False,
                    "consecutive_present": 0,
                    "consecutive_missing": 1,
                    "has_motion": False,
                    "confidence": confidence,
                }
            else:
                cam["truck_in_zone"] = False
                cam["consecutive_missing"] += 1
                cam["consecutive_present"] = 0
                cam["has_motion"] = False
                cam["confidence"] = confidence
                cam["active"] = (camera_id == active_camera_id)

            if focused_camera_id == camera_id:
                focused_camera_id = None
                camera_states[camera_id]["locked"] = False

            log = DetectionLog(
                confidence_score=confidence,
                image_path=image_path,
                camera_id=camera_id,
                camera_name=camera_name,
                notification_status="sent",
            )
            db.add(log)
            db.flush()

            audit = AuditLog(
                user_id=None,
                action_type="truck_departed",
                target_table="tbl_DetectionLog",
                target_id=log.log_id,
                description=f"Truck departed from {camera_name}",
            )
            db.add(audit)
            db.commit()

            return _build_broadcast(event_type, camera_id, camera_name, confidence,
                                    log.log_id, None, image_path, now_str,
                                    f"Garbage truck LEFT {camera_name} — SCANNING")

    except Exception as e:
        print(f"[WebSocket] Error processing event: {e}")
        db.rollback()
        return None
    finally:
        db.close()

    return None


def _build_broadcast(event_type, camera_id, camera_name, confidence,
                     log_id, notif_id, image_path, now, message):
    _ensure_cameras()

    cameras = []
    for cid in sorted(camera_states.keys()):
        s = camera_states[cid]
        cameras.append({
            "camera_id": cid,
            "camera_name": s["name"],
            "truck_present": s["truck_in_zone"],
            "confidence": s["confidence"],
            "is_focused": cid == focused_camera_id,
            "truck_in_zone": s["truck_in_zone"],
            "locked": s["locked"],
            "active": s["active"],
            "consecutive_present": s["consecutive_present"],
            "consecutive_missing": s["consecutive_missing"],
            "has_motion": s["has_motion"],
            "name": s["name"],
        })

    focused_name = camera_states.get(focused_camera_id, {}).get("name") if focused_camera_id else None

    return {
        "type": event_type,
        "camera_id": camera_id,
        "camera_name": camera_name,
        "confidence": confidence,
        "log_id": log_id,
        "notification_id": notif_id,
        "notification_status": "sent" if notif_id else "none",
        "image_path": image_path,
        "timestamp": now,
        "message": message,
        "focused_camera_id": focused_camera_id,
        "focused_camera_name": focused_name,
        "camera_states": cameras,
    }


def _build_state_snapshot(event_type, message):
    _ensure_cameras()
    cameras = []
    for cid in sorted(camera_states.keys()):
        s = camera_states[cid]
        cameras.append({
            "camera_id": cid,
            "camera_name": s["name"],
            "truck_present": s["truck_in_zone"],
            "confidence": s["confidence"],
            "is_focused": cid == focused_camera_id,
            "truck_in_zone": s["truck_in_zone"],
            "locked": s["locked"],
            "active": s["active"],
            "consecutive_present": s["consecutive_present"],
            "consecutive_missing": s["consecutive_missing"],
            "has_motion": s["has_motion"],
            "name": s["name"],
        })
    focused_name = camera_states.get(focused_camera_id, {}).get("name") if focused_camera_id else None
    return {
        "type": event_type,
        "focused_camera_id": focused_camera_id,
        "focused_camera_name": focused_name,
        "camera_states": cameras,
        "message": message or "Connected to Vision-Trak backend",
        "timestamp": datetime.now().strftime("%Y-%m-%d %H:%M:%S"),
    }


@router.websocket("/ws")
async def websocket_endpoint(ws: WebSocket):
    await manager.connect(ws)
    _ensure_cameras()
    await ws.send_text(json.dumps(_build_state_snapshot("connected", None)))
    try:
        while True:
            data = await ws.receive_text()
            try:
                payload = json.loads(data)
                event_type = payload.get("event_type")
                if event_type:
                    broadcast = process_detection_event(payload)
                    if broadcast:
                        await manager.broadcast(broadcast)
            except json.JSONDecodeError:
                pass
    except WebSocketDisconnect:
        manager.disconnect(ws)


@router.post("/api/detection/fire")
def fire_event(payload: dict):
    event_type = payload.get("event_type")
    if not event_type:
        return {"status": "error", "detail": "event_type required"}
    broadcast = process_detection_event(payload)
    return {"status": "ok", "event_type": event_type, "broadcast": broadcast is not None}