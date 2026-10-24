from datetime import datetime, timedelta, timezone

from app.models.user import User
from app.routers import auth as auth_router
from app.services.auth_service import hash_password, verify_password


def create_recovery_user(db):
    user = User(
        username="recovery-user",
        email="owner@example.com",
        password=hash_password("old-password"),
        roles="resident",
    )
    db.add(user)
    db.commit()
    db.refresh(user)
    return user


def test_password_reset_requires_email_code_and_consumes_it(client, db, monkeypatch):
    user = create_recovery_user(db)
    monkeypatch.setattr(auth_router, "send_otp_email", lambda email, otp: True)

    response = client.post(
        "/api/auth/forgot-password",
        json={"email": user.email},
    )
    assert response.status_code == 200
    db.refresh(user)
    otp = user.reset_otp
    assert otp is not None
    assert len(otp) == 6
    assert user.otp_expiry is not None

    invalid_response = client.post(
        "/api/auth/verify-otp",
        json={"email": user.email, "otp": "000000" if otp != "000000" else "000001"},
    )
    assert invalid_response.status_code == 400

    verify_response = client.post(
        "/api/auth/verify-otp",
        json={"email": f" {user.email.upper()} ", "otp": otp},
    )
    assert verify_response.status_code == 200

    reset_response = client.post(
        "/api/auth/reset-password",
        json={"email": f" {user.email.upper()} ", "otp": otp, "new_password": "new-password"},
    )
    assert reset_response.status_code == 200
    db.refresh(user)
    assert verify_password("new-password", user.password)
    assert user.reset_otp is None
    assert user.otp_expiry is None


def test_forgot_password_matches_email_case_insensitively(client, db, monkeypatch):
    user = create_recovery_user(db)
    monkeypatch.setattr(auth_router, "send_otp_email", lambda email, otp: True)

    response = client.post(
        "/api/auth/forgot-password",
        json={"email": f" {user.email.upper()} "},
    )

    assert response.status_code == 200
    db.refresh(user)
    assert user.reset_otp is not None


def test_password_reset_rejects_expired_code(client, db):
    user = create_recovery_user(db)
    user.reset_otp = "123456"
    user.otp_expiry = datetime.now(timezone.utc) - timedelta(seconds=1)
    db.commit()

    response = client.post(
        "/api/auth/reset-password",
        json={"email": user.email, "otp": "123456", "new_password": "new-password"},
    )

    assert response.status_code == 400
    assert response.json()["detail"] == "Verification code has expired."
    db.refresh(user)
    assert verify_password("old-password", user.password)


def test_password_reset_rejects_code_without_expiry(client, db):
    user = create_recovery_user(db)
    user.reset_otp = "123456"
    user.otp_expiry = None
    db.commit()

    response = client.post(
        "/api/auth/verify-otp",
        json={"email": user.email, "otp": "123456"},
    )

    assert response.status_code == 400
    assert response.json()["detail"] == "Verification code has expired."


def test_forgot_password_reports_email_delivery_failure(client, db, monkeypatch):
    user = create_recovery_user(db)
    monkeypatch.setattr(auth_router, "send_otp_email", lambda email, otp: False)

    response = client.post(
        "/api/auth/forgot-password",
        json={"email": user.email},
    )

    assert response.status_code == 503
    assert response.json()["detail"] == "Unable to send the verification code. Please try again later."
    db.refresh(user)
    assert user.reset_otp is None
    assert user.otp_expiry is None
