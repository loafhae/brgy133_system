from typing import Optional
from datetime import datetime, date
from fastapi import APIRouter, Depends, HTTPException, status
from sqlalchemy.orm import Session
from app.database import get_db
from app.models.user import User, Resident, ResidentAddress
from app.schemas.resident import FCMTokenUpdate
from app.services.auth_service import hash_password
from app.services.phone import normalize_philippine_mobile
from app.services.resident_data import get_or_create_address
from app.dependencies import get_current_user, require_role

router = APIRouter(prefix="/residents", tags=["Residents"])

def parse_birthday(raw):
    if not raw:
        return None
    if isinstance(raw, datetime):
        return raw.date()
    if isinstance(raw, date):
        return raw
    if isinstance(raw, str) and raw.strip():
        s = raw.strip()[:10]
        try:
            return date.fromisoformat(s)
        except Exception:
            try:
                return datetime.strptime(s, "%Y-%m-%d").date()
            except Exception:
                return None
    return None


def serialize_resident(resident: Resident) -> dict:
    return {
        "resident_id": resident.resident_id,
        "user_id": resident.user_id,
        "username": resident.user.username if resident.user else None,
        "first_name": resident.first_name,
        "middle_name": resident.middle_name,
        "last_name": resident.last_name,
        "birthday": resident.birthday,
        "gender": resident.gender,
        "address": resident.address,
        "contact": resident.contact,
        "civil_status": resident.civil_status,
        "email": resident.user.email if resident.user else None,
        "is_approved": resident.user.is_approved if resident.user else None,
    }


@router.get("")
def get_residents(
    search: Optional[str] = None,
    db: Session = Depends(get_db),
    current_user: User = Depends(require_role("super_admin", "official"))
):
    try:
        query = db.query(Resident)
        if search:
            query = query.filter(
                (Resident.first_name.ilike(f"%{search}%")) |
                (Resident.last_name.ilike(f"%{search}%")) |
                (Resident.address_record.has(ResidentAddress.address_line.ilike(f"%{search}%")))
            )
        residents = query.all()
        return [serialize_resident(resident) for resident in residents]
    except Exception:
        raise HTTPException(status_code=500, detail="Unable to load resident records.")

@router.post("", status_code=status.HTTP_201_CREATED)
def create_resident(body: dict, db: Session = Depends(get_db), current_user: User = Depends(require_role("super_admin", "official"))):
    # 1. Create the user credentials first
    username = body.get("username")
    email = body.get("email")
    password = body.get("password")

    if not username or not password:
        raise HTTPException(status_code=400, detail="Username and password are required.")

    existing_user = db.query(User).filter(User.username == username).first()
    if existing_user:
        raise HTTPException(status_code=400, detail="Username already exists.")
    email = (email or "").strip() or None
    if email and db.query(User).filter(User.email == email).first():
        raise HTTPException(status_code=400, detail="Email already registered.")

    fn = (body.get("first_name") or "").strip()
    ln = (body.get("last_name") or "").strip()
    birthday_parsed = parse_birthday(body.get("birthday"))
    try:
        contact = normalize_philippine_mobile(body.get("mobile") or body.get("contact") or "")
    except ValueError as exc:
        raise HTTPException(status_code=422, detail=str(exc)) from exc
    gender = body.get("gender")
    if gender is not None and (
        not isinstance(gender, str) or len(gender.strip()) > 100
    ):
        raise HTTPException(
            status_code=422,
            detail="Gender must be a text value no longer than 100 characters.",
        )

    # Duplicate check based on Full Name and Birthday (FR2 Acceptance Criteria 4)
    if fn and ln and birthday_parsed:
        dup = db.query(Resident).filter(
            Resident.first_name == fn,
            Resident.last_name == ln,
            Resident.birthday == birthday_parsed
        ).first()
        if dup:
            raise HTTPException(status_code=400, detail="Resident with this full name and birthday already exists.")

    new_user = User(
        username=username,
        email=email,
        password=hash_password(password),
        roles="resident",
        is_approved=1
    )
    try:
        db.add(new_user)
        db.flush()

        new_resident = Resident(
            user_id=new_user.user_id,
            first_name=fn,
            middle_name=(body.get("middle_name") or "").strip() or None,
            last_name=ln,
            gender=(gender.strip()[:100] or None) if gender else None,
            birthday=birthday_parsed,
            civil_status=body.get("civil_status") or "Single",
            address_record=get_or_create_address(db, body.get("address")),
            contact=contact,
        )
        db.add(new_resident)
        db.commit()
        db.refresh(new_resident)
    except Exception:
        db.rollback()
        raise

    return {
        "message": "Resident registered successfully.",
        "resident_id": new_resident.resident_id,
        "first_name": new_resident.first_name,
        "last_name": new_resident.last_name,
        "user_id": new_resident.user_id,
    }

@router.put("/fcm-token")
@router.put("/fcm-token/")
def update_fcm_token(body: FCMTokenUpdate, db: Session = Depends(get_db), current_user: User = Depends(get_current_user)):
    resident = db.query(Resident).filter(Resident.user_id == current_user.user_id).first()
    if not resident:
        raise HTTPException(status_code=404, detail="Resident not found")
    resident.fcm_token = body.fcm_token
    db.commit()
    return {"message": "FCM token updated successfully."}

@router.put("/{resident_id}")
def update_resident(resident_id: int, body: dict, db: Session = Depends(get_db), current_user: User = Depends(require_role("super_admin", "official"))):
    resident = db.query(Resident).filter(Resident.resident_id == resident_id).first()
    if not resident:
        raise HTTPException(status_code=404, detail="Resident not found")
    
    allowed_fields = {
        "first_name", "middle_name", "last_name", "gender", "birthday",
        "civil_status", "contact", "email",
    }
    try:
        for key, value in body.items():
            if key not in allowed_fields or value is None:
                continue
            if key == "birthday":
                value = parse_birthday(value)
            elif key == "gender":
                if not isinstance(value, str) or len(value.strip()) > 100:
                    raise HTTPException(
                        status_code=422,
                        detail="Gender must be a text value no longer than 100 characters.",
                    )
                value = value.strip() or None
            elif key == "contact":
                value = normalize_philippine_mobile(value)
            elif key == "email":
                normalized_email = value.strip() or None
                if resident.user:
                    if normalized_email and db.query(User).filter(
                        User.email == normalized_email,
                        User.user_id != resident.user_id,
                    ).first():
                        raise HTTPException(status_code=400, detail="Email already registered.")
                    resident.user.email = normalized_email
                continue
            setattr(resident, key, value)

        if "address" in body:
            resident.address_record = get_or_create_address(db, body["address"])
    except ValueError as exc:
        raise HTTPException(status_code=422, detail=str(exc)) from exc

    db.commit()
    db.refresh(resident)
    return {
        "message": "Resident updated successfully.",
        "resident_id": resident.resident_id,
        "first_name": resident.first_name,
        "last_name": resident.last_name,
        "address": resident.address,
    }

@router.delete("/{resident_id}", status_code=status.HTTP_204_NO_CONTENT)
def delete_resident(resident_id: int, db: Session = Depends(get_db), current_user: User = Depends(require_role("super_admin"))):
    resident = db.query(Resident).filter(Resident.resident_id == resident_id).first()
    if not resident:
        raise HTTPException(status_code=404, detail="Resident not found")
        
    db.delete(resident)
    db.commit()
    return None