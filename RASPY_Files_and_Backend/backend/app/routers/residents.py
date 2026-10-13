from fastapi import APIRouter, Depends, HTTPException, status
from sqlalchemy.orm import Session
from app.database import get_db
from app.models.user import User, Resident
from app.schemas.resident import FCMTokenUpdate
from app.services.auth_service import hash_password
from app.dependencies import get_current_user, require_role

router = APIRouter(prefix="/residents", tags=["Residents"])

@router.get("")
def get_residents(db: Session = Depends(get_db), current_user: User = Depends(require_role("super_admin", "official"))):
    try:
        residents = db.query(Resident).all()
        return residents
    except Exception as e:
        return []

@router.post("")
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

    new_user = User(
        username=username,
        email=email,
        password=hash_password(password),
        roles="resident",
        is_approved=1
    )
    db.add(new_user)
    db.commit()
    db.refresh(new_user)

    # 2. Create the resident profile linked to the new user_id
    new_resident = Resident(
        user_id=new_user.user_id,
        first_name=body.get("first_name", ""),
        middle_name=body.get("middle_name", ""),
        last_name=body.get("last_name", ""),
        gender=body.get("gender", "Other"),
        birthday=body.get("birthday"),
        civil_status=body.get("civil_status", "Single"),
        address=body.get("address", ""),
        contact=body.get("mobile", "")
    )
    db.add(new_resident)
    db.commit()
    db.refresh(new_resident)

    return {"message": "Resident registered successfully.", "resident_id": new_resident.resident_id}

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
    
    for key, value in body.items():
        if hasattr(resident, key) and value is not None:
            setattr(resident, key, value)
            
    db.commit()
    db.refresh(resident)
    return {"message": "Resident updated successfully."}

@router.delete("/{resident_id}")
def delete_resident(resident_id: int, db: Session = Depends(get_db), current_user: User = Depends(require_role("super_admin"))):
    resident = db.query(Resident).filter(Resident.resident_id == resident_id).first()
    if not resident:
        raise HTTPException(status_code=404, detail="Resident not found")
        
    db.delete(resident)
    db.commit()
    return {"message": "Resident deleted successfully."}