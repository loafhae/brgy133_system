from fastapi import APIRouter, Depends
from sqlalchemy.orm import Session
from app.database import get_db
from app.models.user import Resident

router = APIRouter(prefix="/api/residents", tags=["residents"])

@router.get("/")
def get_residents(db: Session = Depends(get_db)):
    residents = db.query(Resident).all()
    return [
        {
            "resident_id": r.resident_id,
            "first_name": r.first_name,
            "middle_name": getattr(r, "middle_name", ""),
            "last_name": r.last_name,
            "gender": getattr(r, "gender", ""),
            "birthday": getattr(r, "birthday", ""),
            "civil_status": getattr(r, "civil_status", ""),
            "address": r.address,
            "contact": r.contact,
            "email": r.user.email if r.user else "",
            "is_approved": getattr(r, "is_approved", 1)
        }
        for r in residents
    ]