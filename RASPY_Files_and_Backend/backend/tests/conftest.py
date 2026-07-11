import sys
import os
from pathlib import Path

sys.path.insert(0, str(Path(__file__).parent.parent))

from fastapi.testclient import TestClient
from sqlalchemy import create_engine
from sqlalchemy.orm import sessionmaker
from app.database import Base, get_db
from app.main import app
from app.services.auth_service import hash_password, create_access_token
from app.models import User, Admin, Official, Resident, Feedback, Announcement, DetectionLog, Notification, SystemSetting, AuditLog
from datetime import datetime, date
import pytest

SQLALCHEMY_DATABASE_URL = "sqlite:///./test.db"
engine = create_engine(SQLALCHEMY_DATABASE_URL, connect_args={"check_same_thread": False})
TestingSessionLocal = sessionmaker(autocommit=False, autoflush=False, bind=engine)

def override_get_db():
    db = TestingSessionLocal()
    try:
        yield db
    finally:
        db.close()

app.dependency_overrides[get_db] = override_get_db

@pytest.fixture(autouse=True)
def setup_db():
    Base.metadata.create_all(bind=engine)
    yield
    Base.metadata.drop_all(bind=engine)

@pytest.fixture
def db():
    db = TestingSessionLocal()
    try:
        yield db
    finally:
        db.close()

@pytest.fixture
def client():
    return TestClient(app)

def _create_user(db, username, password, role, **kwargs):
    user = User(username=username, password=hash_password(password), roles=role, **kwargs)
    db.add(user)
    db.commit()
    db.refresh(user)
    return user

@pytest.fixture
def super_admin_token(db):
    user = _create_user(db, "admin", "admin123", "super_admin")
    return create_access_token({"sub": str(user.user_id), "role": user.roles})

@pytest.fixture
def official_token(db):
    user = _create_user(db, "official1", "official123", "official")
    return create_access_token({"sub": str(user.user_id), "role": user.roles})

@pytest.fixture
def resident_token(db):
    user = _create_user(db, "resident1", "resident123", "resident")
    resident = Resident(user_id=user.user_id, first_name="Juan", last_name="Dela Cruz",
                         birthday=date(1990, 1, 1), address="Barangay 133, Tondo")
    db.add(resident)
    db.commit()
    return create_access_token({"sub": str(user.user_id), "role": user.roles})

@pytest.fixture
def inactive_user_token(db):
    user = _create_user(db, "inactive", "inactive123", "resident", is_active=False)
    return create_access_token({"sub": str(user.user_id), "role": user.roles})

def auth_header(token):
    return {"Authorization": f"Bearer {token}"}
