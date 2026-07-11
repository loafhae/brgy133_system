from fastapi import APIRouter, Depends, HTTPException, status, Query
from sqlalchemy.orm import Session
from typing import Optional
from app.database import get_db
from app.dependencies import require_role
from app.models.user import User, Resident
from app.schemas.resident import ResidentCreate, ResidentUpdate, ResidentResponse, FCMTokenUpdate
from app.services.auth_service import hash_password

router = APIRouter(prefix="/api/residents", tags=["residents"])


@router.get("", response_model=list[ResidentResponse])
def list_residents(
    search: Optional[str] = None,
    page: int = Query(1, ge=1),
    limit: int = Query(20, ge=1, le=100),
    db: Session = Depends(get_db),
    current_user: User = Depends(require_role("super_admin")),
):
    query = db.query(Resident)
    if search:
        query = query.filter(
            Resident.first_name.ilike(f"%{search}%")
            | Resident.last_name.ilike(f"%{search}%")
        )
    residents = query.offset((page - 1) * limit).limit(limit).all()
    return residents


@router.post("", response_model=ResidentResponse, status_code=status.HTTP_201_CREATED)
def create_resident(
    body: ResidentCreate,
    db: Session = Depends(get_db),
    current_user: User = Depends(require_role("super_admin")),
):
    existing = db.query(User).filter(User.username == body.username).first()
    if existing:
        raise HTTPException(status_code=400, detail="Username already exists")

    duplicate = db.query(Resident).filter(
        Resident.first_name == body.first_name,
        Resident.last_name == body.last_name,
        Resident.birthday == body.birthday,
    ).first()
    if duplicate:
        raise HTTPException(status_code=400, detail="Resident already exists (duplicate name and birthday)")

    user = User(
        username=body.username,
        password=hash_password(body.password),
        roles="resident",
        must_change_password=True,
    )
    db.add(user)
    db.flush()

    resident = Resident(
        user_id=user.user_id,
        first_name=body.first_name,
        middle_name=body.middle_name,
        last_name=body.last_name,
        birthday=body.birthday,
        gender=body.gender,
        address=body.address,
        contact=body.contact,
        civil_status=body.civil_status,
        email=body.email,
    )
    db.add(resident)
    db.commit()
    db.refresh(resident)
    return resident


@router.put("/{resident_id}", response_model=ResidentResponse)
def update_resident(
    resident_id: int,
    body: ResidentUpdate,
    db: Session = Depends(get_db),
    current_user: User = Depends(require_role("super_admin")),
):
    resident = db.query(Resident).filter(Resident.resident_id == resident_id).first()
    if not resident:
        raise HTTPException(status_code=404, detail="Resident not found")
    for field, value in body.model_dump(exclude_unset=True).items():
        setattr(resident, field, value)
    db.commit()
    db.refresh(resident)
    return resident


@router.delete("/{resident_id}", status_code=status.HTTP_204_NO_CONTENT)
def delete_resident(
    resident_id: int,
    db: Session = Depends(get_db),
    current_user: User = Depends(require_role("super_admin")),
):
    resident = db.query(Resident).filter(Resident.resident_id == resident_id).first()
    if not resident:
        raise HTTPException(status_code=404, detail="Resident not found")
    user = db.query(User).filter(User.user_id == resident.user_id).first()
    if user:
        db.delete(resident)
        db.flush()
        db.delete(user)
    db.commit()
    return None


@router.put("/fcm-token")
def update_fcm_token(
    body: FCMTokenUpdate,
    db: Session = Depends(get_db),
    current_user: User = Depends(require_role("resident")),
):
    resident = db.query(Resident).filter(Resident.user_id == current_user.user_id).first()
    if not resident:
        raise HTTPException(status_code=404, detail="Resident profile not found")
    resident.fcm_token = body.fcm_token
    db.commit()
    return {"message": "FCM token updated"}
