from typing import Optional

from sqlalchemy import func
from sqlalchemy.orm import Session

from app.models.user import ResidentAddress


def get_or_create_address(db: Session, raw_address: Optional[str]) -> Optional[ResidentAddress]:
    address_line = (raw_address or "").strip()
    if not address_line:
        return None

    address = db.query(ResidentAddress).filter(
        func.lower(ResidentAddress.address_line) == address_line.lower()
    ).first()
    if address:
        return address

    address = ResidentAddress(address_line=address_line)
    db.add(address)
    db.flush()
    return address
