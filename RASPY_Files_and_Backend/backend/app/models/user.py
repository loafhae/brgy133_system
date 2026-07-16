from sqlalchemy import Column, Integer, String, Boolean, DateTime, ForeignKey, Date, Enum
from sqlalchemy.sql import func
from sqlalchemy.orm import relationship
from app.database import Base

class User(Base):
    # ✅ Matches your lowercase database table name exactly
    __tablename__ = "tbl_users"

    # ✅ Physical table schema columns matching phpMyAdmin rows
    user_id = Column(Integer, primary_key=True, autoincrement=True)
    username = Column(String(50), unique=True, nullable=False, index=True)
    password = Column(String(255), nullable=False)
    roles = Column(String(50), nullable=False)
    profile_pic = Column(String(500))
    is_active = Column(Boolean, default=True)
    must_change_password = Column(Boolean, default=False)
    created_at = Column(DateTime, server_default=func.now())
    updated_at = Column(DateTime, server_default=func.now(), onupdate=func.now())

    # ✅ Kept structural profile relationships clean
    admin_profile = relationship("Admin", back_populates="user", uselist=False, cascade="all, delete-orphan")
    official_profile = relationship("Official", back_populates="user", uselist=False, cascade="all, delete-orphan")
    resident_profile = relationship("Resident", back_populates="user", uselist=False, cascade="all, delete-orphan")


class Admin(Base):
    __tablename__ = "tbl_admin"
    admin_id = Column(Integer, primary_key=True, autoincrement=True)
    user_id = Column(Integer, ForeignKey("tbl_users.user_id", ondelete="CASCADE"), unique=True, nullable=False)
    first_name = Column(String(100), nullable=False)
    middle_name = Column(String(100))
    last_name = Column(String(100), nullable=False)
    birthday = Column(Date)
    gender = Column(Enum("Male", "Female", "Other", name="gender_enum"))
    contact = Column(String(20))
    
    user = relationship("User", back_populates="admin_profile")


class Official(Base):
    __tablename__ = "tbl_official"
    official_id = Column(Integer, primary_key=True, autoincrement=True)
    user_id = Column(Integer, ForeignKey("tbl_users.user_id", ondelete="CASCADE"), unique=True, nullable=False)
    first_name = Column(String(100), nullable=False)
    middle_name = Column(String(100))
    last_name = Column(String(100), nullable=False)
    birthday = Column(Date)
    gender = Column(Enum("Male", "Female", "Other", name="gender_enum_official"))
    contact = Column(String(20))
    
    user = relationship("User", back_populates="official_profile")


class Resident(Base):
    __tablename__ = "tbl_residents"
    resident_id = Column(Integer, primary_key=True, autoincrement=True)
    user_id = Column(Integer, ForeignKey("tbl_users.user_id", ondelete="CASCADE"), unique=True, nullable=False)
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