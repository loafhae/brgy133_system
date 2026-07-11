from pydantic import BaseModel
from typing import Optional
from datetime import datetime


class DetectionEvent(BaseModel):
    camera_id: int
    camera_name: str
    confidence: float
    image_path: Optional[str] = None
    timestamp: Optional[str] = None


class DetectionLogResponse(BaseModel):
    log_id: int
    timestamp: Optional[datetime] = None
    confidence_score: float
    image_path: Optional[str] = None
    notification_status: str
    camera_id: Optional[int] = None
    camera_name: Optional[str] = None

    class Config:
        from_attributes = True


class TruckStatusEvent(BaseModel):
    event_type: str  # "truck_present" or "truck_departed"
    camera_id: int
    camera_name: str
    confidence: Optional[float] = None
    image_path: Optional[str] = None


class CameraSwitchEvent(BaseModel):
    camera_id: int
    camera_name: str
    event_type: str  # "scan_start" or "camera_switched"
