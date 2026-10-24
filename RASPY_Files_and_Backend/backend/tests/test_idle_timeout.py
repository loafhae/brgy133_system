from datetime import datetime, timedelta, timezone

from app.config import settings
from app.models import AuditLog, SessionMfaChallenge, User, UserSession
from app.services.auth_service import create_access_token, decode_access_token, hash_password
from app.routers import auth as auth_router

from tests.conftest import auth_header
import pytest


def create_login_user(db):
    user = User(
        username="idle-timeout-user",
        email="idle-timeout@example.com",
        password=hash_password("test-password"),
        roles="super_admin",
        is_approved=1,
    )
    db.add(user)
    db.commit()
    db.refresh(user)
    return user


def login(client, user):
    return client.post(
        "/api/auth/login",
        json={"username": user.username, "password": "test-password"},
    )


def test_login_creates_server_session_and_returns_timeout(client, db):
    user = create_login_user(db)

    response = login(client, user)

    assert response.status_code == 200
    assert response.json()["idle_timeout_minutes"] == settings.IDLE_TIMEOUT_MINUTES
    token = response.json()["access_token"]
    session_id = decode_access_token(token)["sid"]
    session = db.query(UserSession).filter(UserSession.id == session_id).one()
    assert session.user_id == user.user_id
    assert session.revoked_at is None


def test_idle_session_is_revoked_on_next_request(client, db):
    user = create_login_user(db)
    token_response = login(client, user)
    token = token_response.json()["access_token"]
    session_id = decode_access_token(token)["sid"]
    session = db.query(UserSession).filter(UserSession.id == session_id).one()
    session.last_activity_at = (
        datetime.now(timezone.utc).replace(tzinfo=None)
        - timedelta(minutes=settings.IDLE_TIMEOUT_MINUTES, seconds=1)
    )
    db.commit()

    response = client.get("/api/auth/me", headers=auth_header(token))

    assert response.status_code == 401
    assert response.json()["detail"] == "Session expired due to inactivity. Please sign in again."
    db.refresh(session)
    assert session.revoked_at is not None


def test_absolute_session_lifetime_is_enforced(client, db):
    user = create_login_user(db)
    token = login(client, user).json()["access_token"]
    session_id = decode_access_token(token)["sid"]
    session = db.query(UserSession).filter(UserSession.id == session_id).one()
    now = datetime.now(timezone.utc).replace(tzinfo=None)
    session.created_at = now - timedelta(minutes=settings.SESSION_ABSOLUTE_TIMEOUT_MINUTES, seconds=1)
    session.last_activity_at = now
    db.commit()

    response = client.get("/api/auth/me", headers=auth_header(token))

    assert response.status_code == 401
    assert response.json()["detail"] == "Session reached its maximum lifetime. Please sign in again."
    db.refresh(session)
    assert session.revoked_at is not None


def test_activity_heartbeat_refreshes_server_session(client, db):
    user = create_login_user(db)
    token = login(client, user).json()["access_token"]
    session_id = decode_access_token(token)["sid"]
    session = db.query(UserSession).filter(UserSession.id == session_id).one()
    previous_activity = datetime.now(timezone.utc).replace(tzinfo=None) - timedelta(minutes=5)
    session.last_activity_at = previous_activity
    db.commit()

    response = client.post("/api/auth/activity", headers=auth_header(token))

    assert response.status_code == 200
    db.refresh(session)
    assert session.last_activity_at > previous_activity


def test_logout_revokes_server_session(client, db):
    user = create_login_user(db)
    token_response = login(client, user)
    token = token_response.json()["access_token"]
    session_id = decode_access_token(token)["sid"]

    logout_response = client.post("/api/auth/logout", headers=auth_header(token))
    subsequent_response = client.get("/api/auth/me", headers=auth_header(token))

    assert logout_response.status_code == 200
    assert subsequent_response.status_code == 401
    session = db.query(UserSession).filter(UserSession.id == session_id).one()
    assert session.revoked_at is not None
    assert db.query(AuditLog).filter(AuditLog.action_type == "session_logout").count() == 1


def test_tokens_without_a_server_session_are_rejected(client, db):
    user = create_login_user(db)
    token = create_access_token({"sub": str(user.user_id)})

    response = client.get("/api/auth/me", headers=auth_header(token))

    assert response.status_code == 401


def test_browser_login_uses_secure_cookie_not_json_token(client, db, monkeypatch):
    monkeypatch.setattr(settings, "SESSION_COOKIE_SECURE", False)
    user = create_login_user(db)

    response = client.post(
        "/api/auth/login",
        headers={"X-Session-Client": "web"},
        json={"username": user.username, "password": "test-password"},
    )

    assert response.status_code == 200
    assert response.json()["access_token"] is None
    assert response.json()["token_type"] == "cookie"
    cookie = response.cookies.get("visiontrak_session")
    assert cookie
    set_cookie = response.headers["set-cookie"].lower()
    assert "httponly" in set_cookie
    assert "samesite=lax" in set_cookie
    assert "secure" not in set_cookie
    assert client.get("/api/auth/me").status_code == 200


def test_production_browser_cookie_is_host_only_secure_and_http_only(client, db, monkeypatch):
    monkeypatch.setattr(settings, "SESSION_COOKIE_SECURE", True)
    user = create_login_user(db)

    response = client.post(
        "/api/auth/login",
        headers={"X-Session-Client": "web"},
        json={"username": user.username, "password": "test-password"},
    )

    assert response.status_code == 200
    cookie = response.headers["set-cookie"].lower()
    assert "__host-visiontrak_session=" in cookie
    assert "secure" in cookie
    assert "httponly" in cookie
    assert "samesite=lax" in cookie
    assert "path=/" in cookie
    assert "max-age=28800" in cookie


def test_public_http_requests_redirect_to_https():
    from fastapi.testclient import TestClient
    from app.main import app

    client = TestClient(app, base_url="http://visiontrak.ragetech.dev", follow_redirects=False)
    response = client.get("/api/auth/me")

    assert response.status_code == 308
    assert response.headers["location"] == "https://visiontrak.ragetech.dev/api/auth/me"


def test_cors_rejects_wildcard_origins(monkeypatch):
    monkeypatch.setattr(settings, "CORS_ORIGINS", '["*"]')

    with pytest.raises(ValueError, match="wildcard CORS is not allowed"):
        settings.CORS_ORIGINS_LIST


def test_cookie_session_rejects_cross_site_write_without_custom_header(client, db, monkeypatch):
    monkeypatch.setattr(settings, "SESSION_COOKIE_SECURE", False)
    user = create_login_user(db)
    response = client.post(
        "/api/auth/login",
        headers={"X-Session-Client": "web"},
        json={"username": user.username, "password": "test-password"},
    )
    token = response.cookies.get("visiontrak_session")
    session_id = decode_access_token(token)["sid"]

    logout_response = client.post("/api/auth/logout")

    assert logout_response.status_code == 403
    session = db.query(UserSession).filter(UserSession.id == session_id).one()
    assert session.revoked_at is None


def test_email_mfa_is_required_and_verified_for_password_change(client, db, monkeypatch):
    user = create_login_user(db)
    sent_codes = []
    monkeypatch.setattr(
        auth_router,
        "send_mfa_otp_email",
        lambda email, otp: sent_codes.append((email, otp)) or True,
    )
    token = login(client, user).json()["access_token"]
    headers = auth_header(token)
    password_change = {
        "current_password": "test-password",
        "new_password": "updated-password",
    }

    blocked = client.post("/api/auth/change-password", headers=headers, json=password_change)
    challenge = client.post("/api/auth/mfa/challenge", headers=headers)

    assert blocked.status_code == 428
    assert challenge.status_code == 200
    assert sent_codes[0][0] == user.email
    assert sent_codes[0][1].isdigit()
    verify = client.post(
        "/api/auth/mfa/verify",
        headers=headers,
        json={"otp": sent_codes[0][1]},
    )
    completed = client.post("/api/auth/change-password", headers=headers, json=password_change)

    assert verify.status_code == 200
    assert completed.status_code == 200
    mfa = db.query(SessionMfaChallenge).one()
    assert mfa.code_hash == ""
    assert mfa.verified_at is not None
    assert db.query(AuditLog).filter(AuditLog.action_type == "mfa_verified").count() == 1


def test_email_mfa_fails_closed_when_delivery_fails(client, db, monkeypatch):
    user = create_login_user(db)
    monkeypatch.setattr(auth_router, "send_mfa_otp_email", lambda email, otp: False)
    token = login(client, user).json()["access_token"]

    response = client.post("/api/auth/mfa/challenge", headers=auth_header(token))

    assert response.status_code == 503
    assert db.query(SessionMfaChallenge).count() == 0


def test_privileged_user_management_requires_email_mfa(client, db):
    user = create_login_user(db)
    token = login(client, user).json()["access_token"]

    response = client.post(
        "/api/users",
        headers=auth_header(token),
        json={"username": "new-official", "password": "strong-password"},
    )

    assert response.status_code == 428
