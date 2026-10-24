from typing import Optional
from datetime import datetime, date
from sqlalchemy import String, Boolean, DateTime, ForeignKey, Date, Enum, Integer
from sqlalchemy.sql import func
from sqlalchemy.orm import Mapped, mapped_column, relationship
from app.database import Base

class User(Base):
    __tablename__ = "tbl_users"

    user_id: Mapped[int] = mapped_column(Integer, primary_key=True, autoincrement=True)
    username: Mapped[str] = mapped_column(String(50), unique=True, nullable=False, index=True)
    email: Mapped[Optional[str]] = mapped_column(String(255), unique=True, index=True, nullable=True) # Added for email & recovery
    password: Mapped[str] = mapped_column(String(255), nullable=False)
    roles: Mapped[str] = mapped_column(String(50), nullable=False)
    profile_pic: Mapped[Optional[str]] = mapped_column(String(500), nullable=True)
    is_active: Mapped[Optional[bool]] = mapped_column(Boolean, default=True)
    is_approved: Mapped[Optional[int]] = mapped_column(Integer, default=1)  # 1 for admins/officials, 0 for pending residents
    reset_otp: Mapped[Optional[str]] = mapped_column(String(10), nullable=True) # For password recovery code
    otp_expiry: Mapped[Optional[datetime]] = mapped_column(DateTime, nullable=True) # For code expiration
    must_change_password: Mapped[Optional[bool]] = mapped_column(Boolean, default=False)
    last_seen: Mapped[Optional[datetime]] = mapped_column(DateTime, nullable=True)
    created_at: Mapped[Optional[datetime]] = mapped_column(DateTime, server_default=func.now())
    updated_at: Mapped[Optional[datetime]] = mapped_column(DateTime, server_default=func.now(), onupdate=func.now())

    admin_profile: Mapped[Optional["Admin"]] = relationship("Admin", back_populates="user", uselist=False, cascade="all, delete-orphan")
    official_profile: Mapped[Optional["Official"]] = relationship("Official", back_populates="user", uselist=False, cascade="all, delete-orphan")
    resident_profile: Mapped[Optional["Resident"]] = relationship("Resident", back_populates="user", uselist=False, cascade="all, delete-orphan")

    @property
    def role(self) -> str:
        return self.roles or ""


class Admin(Base):
    __tablename__ = "tbl_admin"
    admin_id: Mapped[int] = mapped_column(Integer, primary_key=True, autoincrement=True)
    user_id: Mapped[int] = mapped_column(Integer, ForeignKey("tbl_users.user_id", ondelete="CASCADE"), unique=True, nullable=False)
    first_name: Mapped[str] = mapped_column(String(100), nullable=False)
    middle_name: Mapped[Optional[str]] = mapped_column(String(100), nullable=True)
    last_name: Mapped[str] = mapped_column(String(100), nullable=False)
    birthday: Mapped[Optional[date]] = mapped_column(Date, nullable=True)
    gender: Mapped[Optional[str]] = mapped_column(String(100), nullable=True)
    contact: Mapped[Optional[str]] = mapped_column(String(20), nullable=True)
   
    user: Mapped[Optional["User"]] = relationship("User", back_populates="admin_profile")


class Official(Base):
    __tablename__ = "tbl_official"
    official_id: Mapped[int] = mapped_column(Integer, primary_key=True, autoincrement=True)
    user_id: Mapped[int] = mapped_column(Integer, ForeignKey("tbl_users.user_id", ondelete="CASCADE"), unique=True, nullable=False)
    first_name: Mapped[str] = mapped_column(String(100), nullable=False)
    middle_name: Mapped[Optional[str]] = mapped_column(String(100), nullable=True)
    last_name: Mapped[str] = mapped_column(String(100), nullable=False)
    birthday: Mapped[Optional[date]] = mapped_column(Date, nullable=True)
    gender: Mapped[Optional[str]] = mapped_column(String(100), nullable=True)
    contact: Mapped[Optional[str]] = mapped_column(String(20), nullable=True)
   
    user: Mapped[Optional["User"]] = relationship("User", back_populates="official_profile")


class ResidentAddress(Base):
    __tablename__ = "tbl_resident_addresses"

    address_id: Mapped[int] = mapped_column(Integer, primary_key=True, autoincrement=True)
    address_line: Mapped[str] = mapped_column(String(500), unique=True, nullable=False)

    residents: Mapped[list["Resident"]] = relationship("Resident", back_populates="address_record")


class Resident(Base):
    __tablename__ = "tbl_residents"
    resident_id: Mapped[int] = mapped_column(Integer, primary_key=True, autoincrement=True)
    user_id: Mapped[int] = mapped_column(Integer, ForeignKey("tbl_users.user_id", ondelete="CASCADE"), unique=True, nullable=False)
    first_name: Mapped[str] = mapped_column(String(100), nullable=False)
    middle_name: Mapped[Optional[str]] = mapped_column(String(100), nullable=True)
    last_name: Mapped[str] = mapped_column(String(100), nullable=False)
    birthday: Mapped[Optional[date]] = mapped_column(Date, nullable=True)
    gender: Mapped[Optional[str]] = mapped_column(String(100), nullable=True)
    address_id: Mapped[Optional[int]] = mapped_column(
        Integer,
        ForeignKey("tbl_resident_addresses.address_id", ondelete="SET NULL"),
        nullable=True,
        index=True,
    )
    contact: Mapped[Optional[str]] = mapped_column(String(20), nullable=True)
    civil_status: Mapped[Optional[str]] = mapped_column(Enum("Single", "Married", "Widowed", "Separated", name="civil_status_enum"), nullable=True)
    fcm_token: Mapped[Optional[str]] = mapped_column(String(500), nullable=True)
   
    user: Mapped[Optional["User"]] = relationship("User", back_populates="resident_profile")
    address_record: Mapped[Optional[ResidentAddress]] = relationship("ResidentAddress", back_populates="residents")

    @property
    def address(self) -> Optional[str]:
        return self.address_record.address_line if self.address_record else None

    @address.setter
    def address(self, value: Optional[str]) -> None:
        if value is None or not value.strip():
            self.address_record = None
        else:
            self.address_record = ResidentAddress(address_line=value.strip())

    @property
    def email(self) -> Optional[str]:
        return self.user.email if self.user else None

    @email.setter
    def email(self, value: Optional[str]) -> None:
        if self.user:
            self.user.email = value.strip() if value else None