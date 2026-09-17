from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy.orm import Session
from app.database import get_db
from app.dependencies import require_role
from app.models.user import User
from app.models.settings import SystemSetting
from pydantic import BaseModel
from typing import Optional

router = APIRouter(prefix="/api/settings", tags=["settings"])


class SettingUpdate(BaseModel):
    config_value: str


@router.get("")
def list_settings(
    db: Session = Depends(get_db),
    current_user: User = Depends(require_role("super_admin")),
):
    settings = db.query(SystemSetting).all()
    return {s.config_key: s.config_value for s in settings}


@router.put("/{key}")
def update_setting(
    key: str,
    body: SettingUpdate,
    db: Session = Depends(get_db),
    current_user: User = Depends(require_role("super_admin")),
):
    setting = db.query(SystemSetting).filter(SystemSetting.config_key == key).first()
    if not setting:
        setting = SystemSetting(
            config_key=key,
            config_value=body.config_value,
            updated_by=current_user.user_id,
        )
        db.add(setting)
    else:
        setting.config_value = body.config_value
        setting.updated_by = current_user.user_id
    db.commit()
    return {"message": f"Setting '{key}' updated", "value": body.config_value}