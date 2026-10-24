from datetime import date

import pytest
from sqlalchemy import create_engine, inspect, text
from sqlalchemy.orm import Session

from app.models.user import Resident, ResidentAddress, User
from app.routers.auth import get_current_user_profile, update_profile
from app.schemas.auth import ProfileUpdate
from app.services.phone import normalize_philippine_mobile
from app.services.resident_migration import migrate_resident_schema


@pytest.mark.parametrize(
    ("raw_number", "expected"),
    [
        ("09123456789", "+639123456789"),
        ("+639123456789", "+639123456789"),
        ("639123456789", "+639123456789"),
        ("+63 (912) 345-6789", "+639123456789"),
    ],
)
def test_normalize_philippine_mobile(raw_number, expected):
    assert normalize_philippine_mobile(raw_number) == expected


@pytest.mark.parametrize("raw_number", ["", "1234567890", "02123456789", "+12025550123"])
def test_reject_non_philippine_mobile(raw_number):
    with pytest.raises(ValueError):
        normalize_philippine_mobile(raw_number)


def test_residents_can_share_normalized_address(db: Session):
    first_user = User(username="resident-a", password="hashed", roles="resident")
    second_user = User(username="resident-b", password="hashed", roles="resident")
    address = ResidentAddress(address_line="10 Example Street")
    first_user.resident_profile = Resident(
        first_name="A",
        last_name="Resident",
        birthday=date(2000, 1, 1),
        contact="+639123456789",
        address_record=address,
    )
    second_user.resident_profile = Resident(
        first_name="B",
        last_name="Resident",
        birthday=date(2000, 1, 1),
        contact="+639123456780",
        address_record=address,
    )
    db.add_all([first_user, second_user])
    db.commit()

    assert first_user.resident_profile.address_id == second_user.resident_profile.address_id
    assert first_user.resident_profile.address == "10 Example Street"


def test_migrate_legacy_resident_address_and_email_without_losing_data():
    engine = create_engine("sqlite:///:memory:")
    with engine.begin() as connection:
        connection.execute(text(
            "CREATE TABLE tbl_users (user_id INTEGER PRIMARY KEY, email VARCHAR(255))"
        ))
        connection.execute(text(
            "CREATE TABLE tbl_residents ("
            "resident_id INTEGER PRIMARY KEY, user_id INTEGER NOT NULL, "
            "address VARCHAR(500), email VARCHAR(100))"
        ))
        connection.execute(text(
            "INSERT INTO tbl_users (user_id, email) VALUES (1, NULL), (2, NULL)"
        ))
        connection.execute(text(
            "INSERT INTO tbl_residents (resident_id, user_id, address, email) "
            "VALUES (1, 1, '10 Example Street', 'one@example.com'), "
            "(2, 2, ' 10 Example Street ', 'two@example.com')"
        ))

    migrate_resident_schema(engine)
    migrate_resident_schema(engine)

    inspector = inspect(engine)
    resident_columns = {column["name"] for column in inspector.get_columns("tbl_residents")}
    with engine.connect() as connection:
        residents = connection.execute(text(
            "SELECT address_id FROM tbl_residents ORDER BY resident_id"
        )).scalars().all()
        emails = connection.execute(text(
            "SELECT email FROM tbl_users ORDER BY user_id"
        )).scalars().all()
        addresses = connection.execute(text(
            "SELECT address_line FROM tbl_resident_addresses"
        )).scalars().all()

    assert "address" not in resident_columns
    assert "email" not in resident_columns
    assert residents[0] == residents[1]
    assert emails == ["one@example.com", "two@example.com"]
    assert addresses == ["10 Example Street"]
    engine.dispose()


def test_staff_resident_creation_requires_philippine_mobile(client, official_token):
    headers = {"Authorization": f"Bearer {official_token}"}
    body = {
        "username": "new-resident",
        "password": "resident-password",
        "first_name": "New",
        "last_name": "Resident",
        "contact": "1234567890",
    }

    response = client.post("/api/residents", json=body, headers=headers)

    assert response.status_code == 422


def test_staff_resident_creation_stores_canonical_phone_and_shared_address(client, official_token, db):
    headers = {"Authorization": f"Bearer {official_token}"}
    body = {
        "username": "normalized-resident",
        "password": "resident-password",
        "email": "normalized@example.com",
        "first_name": "Normalized",
        "last_name": "Resident",
        "contact": "09123456789",
        "address": "10 Example Street",
        "gender": "Genderfluid",
    }

    response = client.post("/api/residents", json=body, headers=headers)

    assert response.status_code == 201
    resident = db.query(Resident).join(User).filter(User.username == "normalized-resident").one()
    assert resident.contact == "+639123456789"
    assert resident.gender == "Genderfluid"
    assert resident.user.email == "normalized@example.com"
    assert resident.address == "10 Example Street"

    list_response = client.get("/api/residents", headers=headers)
    serialized = next(
        row for row in list_response.json() if row["resident_id"] == resident.resident_id
    )
    assert serialized["address"] == "10 Example Street"
    assert serialized["email"] == "normalized@example.com"


def test_resident_can_update_profile_with_self_described_gender(db: Session, resident_token):
    user = db.query(User).filter(User.username == "resident1").one()
    body = ProfileUpdate(
        first_name="Alex",
        middle_name="",
        last_name="Resident",
        birthday="1995-04-12",
        gender="Non-binary",
        address="22 Sample Street",
        contact="09123456789",
        civil_status="Single",
    )

    update_profile(body, db, user)
    db.refresh(user)
    profile = user.resident_profile

    assert profile.first_name == "Alex"
    assert profile.birthday == date(1995, 4, 12)
    assert profile.gender == "Non-binary"
    assert profile.address == "22 Sample Street"
    assert profile.contact == "+639123456789"
    assert profile.civil_status == "Single"


def test_current_user_response_includes_resident_profile_fields(client, db, resident_token):
    resident = db.query(Resident).join(User).filter(User.username == "resident1").one()
    resident.gender = "Genderqueer"
    resident.address = "22 Sample Street"
    db.commit()

    response = client.get(
        "/api/auth/me",
        headers={"Authorization": f"Bearer {resident_token}"},
    )

    assert response.status_code == 200
    assert response.json()["gender"] == "Genderqueer"
    assert response.json()["address"] == "22 Sample Street"
