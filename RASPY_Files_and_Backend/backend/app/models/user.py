from sqlalchemy import Column, Integer, String, Boolean, Enum, DateTime, ForeignKey, Date
from sqlalchemy.orm import relationship
from sqlalchemy.sql import func
from app.database import Base


class User(Base):
    __tablename__ = "tbl_Users"

    user_id = Column(Integer, primary_key=True, autoincrement=True)
    username = Column(String(50), unique=True, nullable=False, index=True)
    password = Column(String(255), nullable=False)
    roles = Column(Enum("super_admin", "official", "resident", name="user_roles"), nullable=False)
    is_active = Column(Boolean, default=True)
    must_change_password = Column(Boolean, default=False)
    profile_pic = Column(String(500))
    created_at = Column(DateTime, server_default=func.now())
    updated_at = Column(DateTime, server_default=func.now(), onupdate=func.now())

    admin_profile = relationship("Admin", back_populates="user", uselist=False)
    official_profile = relationship("Official", back_populates="user", uselist=False)
    resident_profile = relationship("Resident", back_populates="user", uselist=False)
    announcements = relationship("Announcement", back_populates="creator")
    feedbacks = relationship("Feedback", back_populates="author")
    audit_logs = relationship("AuditLog", back_populates="user")


class Admin(Base):
    __tablename__ = "tbl_Admin"

    admin_id = Column(Integer, primary_key=True, autoincrement=True)
    user_id = Column(Integer, ForeignKey("tbl_Users.user_id", ondelete="CASCADE"), unique=True, nullable=False)
    first_name = Column(String(100), nullable=False)
    middle_name = Column(String(100))
    last_name = Column(String(100), nullable=False)
    birthday = Column(Date)
    gender = Column(Enum("Male", "Female", "Other", name="gender_enum"))
    contact = Column(String(20))

    user = relationship("User", back_populates="admin_profile")


class Official(Base):
    __tablename__ = "tbl_Official"

    official_id = Column(Integer, primary_key=True, autoincrement=True)
    user_id = Column(Integer, ForeignKey("tbl_Users.user_id", ondelete="CASCADE"), unique=True, nullable=False)
    first_name = Column(String(100), nullable=False)
    middle_name = Column(String(100))
    last_name = Column(String(100), nullable=False)
    birthday = Column(Date)
    gender = Column(Enum("Male", "Female", "Other", name="gender_enum_official"))
    contact = Column(String(20))

    user = relationship("User", back_populates="official_profile")


class Resident(Base):
    __tablename__ = "tbl_Residents"

    resident_id = Column(Integer, primary_key=True, autoincrement=True)
    user_id = Column(Integer, ForeignKey("tbl_Users.user_id", ondelete="CASCADE"), unique=True, nullable=False)
    first_name = Column(String(100), nullable=False)
    middle_name = Column(String(100))
    last_name = Column(String(100), nullable=False)
    birthday = Column(Date)
    gender = Column(Enum("Male", "Female", "Other", name="gender_enum_resident"))
    address = Column(String(500))
    contact = Column(String(20))
    civil_status = Column(Enum("Single", "Married", "Widowed", "Separated", name="civil_status_enum"))
    email = Column(String(100))
    fcm_token = Column(String(500))

    user = relationship("User", back_populates="resident_profile")
