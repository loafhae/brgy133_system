import pytest
from fastapi import WebSocketDisconnect

import app.main as main_module
from app.config import settings, validate_deployment_settings
from app.models import Report
from app.routers import detection as detection_router
from app.routers import reports as reports_router
from app.routers import websocket as websocket_router


def test_production_configuration_accepts_secure_settings(monkeypatch):
    monkeypatch.setattr(settings, "APP_ENV", "production")
    monkeypatch.setattr(settings, "SECRET_KEY", "s" * 48)
    monkeypatch.setattr(settings, "DETECTOR_API_KEY", "d" * 48)
    monkeypatch.setattr(settings, "DATABASE_USER", "vision_trak_app")
    monkeypatch.setattr(settings, "DATABASE_PASSWORD", "p" * 24)
    monkeypatch.setattr(settings, "SESSION_COOKIE_SECURE", True)
    monkeypatch.setattr(settings, "REQUIRE_HTTPS", True)
    monkeypatch.setattr(settings, "SMTP_EMAIL", "noreply@example.org")
    monkeypatch.setattr(settings, "SMTP_APP_PASSWORD", "configured")
    monkeypatch.setattr(settings, "CORS_ORIGINS", '["https://visiontrak.example.org"]')

    validate_deployment_settings()


def test_production_configuration_rejects_default_database_credentials(monkeypatch):
    monkeypatch.setattr(settings, "APP_ENV", "production")
    monkeypatch.setattr(settings, "SECRET_KEY", "s" * 48)
    monkeypatch.setattr(settings, "DETECTOR_API_KEY", "d" * 48)
    monkeypatch.setattr(settings, "DATABASE_USER", "root")
    monkeypatch.setattr(settings, "DATABASE_PASSWORD", "")
    monkeypatch.setattr(settings, "SESSION_COOKIE_SECURE", True)
    monkeypatch.setattr(settings, "REQUIRE_HTTPS", True)
    monkeypatch.setattr(settings, "SMTP_EMAIL", "noreply@example.org")
    monkeypatch.setattr(settings, "SMTP_APP_PASSWORD", "configured")
    monkeypatch.setattr(settings, "CORS_ORIGINS", '["https://visiontrak.example.org"]')

    with pytest.raises(ValueError, match="dedicated non-root"):
        validate_deployment_settings()


def test_production_configuration_rejects_weak_detector_key(monkeypatch):
    monkeypatch.setattr(settings, "APP_ENV", "production")
    monkeypatch.setattr(settings, "SECRET_KEY", "s" * 48)
    monkeypatch.setattr(
        settings,
        "DETECTOR_API_KEY",
        "d" * 12,
    )
    monkeypatch.setattr(settings, "DATABASE_USER", "vision_trak_app")
    monkeypatch.setattr(settings, "DATABASE_PASSWORD", "unique-password")
    monkeypatch.setattr(settings, "SESSION_COOKIE_SECURE", True)
    monkeypatch.setattr(settings, "REQUIRE_HTTPS", True)
    monkeypatch.setattr(settings, "SMTP_EMAIL", "noreply@example.org")
    monkeypatch.setattr(settings, "SMTP_APP_PASSWORD", "configured")
    monkeypatch.setattr(settings, "CORS_ORIGINS", '["https://visiontrak.example.org"]')

    with pytest.raises(ValueError, match="DETECTOR_API_KEY"):
        validate_deployment_settings()


def test_public_report_download_requires_staff_auth_and_is_not_static(
    client, db, super_admin_token, tmp_path, monkeypatch
):
    report_dir = tmp_path / "reports"
    report_dir.mkdir()
    report_file = report_dir / "private.pdf"
    report_file.write_bytes(b"private report")
    monkeypatch.setattr(reports_router, "REPORT_UPLOAD_DIR", report_dir)

    report = Report(
        title="Private feedback",
        report_type="feedback",
        file_format="pdf",
        file_path=str(report_file),
    )
    db.add(report)
    db.commit()
    db.refresh(report)

    assert client.get(f"/api/reports/{report.report_id}/download").status_code == 401
    assert client.get("/uploads/reports/private.pdf").status_code == 404

    response = client.get(
        f"/api/reports/{report.report_id}/download",
        headers={"Authorization": f"Bearer {super_admin_token}"},
    )
    assert response.status_code == 200
    assert response.content == b"private report"


def test_spa_fallback_does_not_serve_files_outside_build_directory(
    client, tmp_path, monkeypatch
):
    dist_dir = tmp_path / "dist"
    dist_dir.mkdir()
    (dist_dir / "index.html").write_text("safe application shell", encoding="utf-8")
    (tmp_path / "secret.txt").write_text("private sentinel", encoding="utf-8")
    monkeypatch.setattr(main_module, "_dist_dir", str(dist_dir))

    response = client.get("/%2e%2e%2fsecret.txt")

    assert response.status_code == 200
    assert response.text == "safe application shell"
    assert "private sentinel" not in response.text


def test_detection_snapshots_require_staff_authentication(
    client, super_admin_token, tmp_path, monkeypatch
):
    snapshot_dir = tmp_path / "snapshots"
    snapshot_dir.mkdir()
    snapshot_file = snapshot_dir / "private.jpg"
    snapshot_file.write_bytes(b"private camera frame")
    monkeypatch.setattr(detection_router, "SNAPSHOT_DIR", snapshot_dir)

    assert client.get("/snapshots/private.jpg").status_code == 404
    assert client.get("/api/detection/snapshots/private.jpg").status_code == 401

    response = client.get(
        "/api/detection/snapshots/private.jpg",
        headers={"Authorization": f"Bearer {super_admin_token}"},
    )
    assert response.status_code == 200, response.text
    assert response.content == b"private camera frame"


def test_detector_event_ingestion_requires_detector_key(client, monkeypatch):
    detector_key = "unique-test-detector-key"
    monkeypatch.setattr(settings, "DETECTOR_API_KEY", detector_key)
    monkeypatch.setattr(websocket_router, "process_detection_event", lambda *args, **kwargs: None)
    payload = {
        "event_type": "truck_present",
        "camera_id": 1,
        "camera_name": "Test camera",
        "confidence": 0.9,
    }

    assert client.post("/api/detection/fire", json=payload).status_code == 401
    assert client.post("/api/detection/event", json=payload).status_code == 401

    response = client.post(
        "/api/detection/fire",
        json=payload,
        headers={"Authorization": f"Bearer {detector_key}"},
    )
    assert response.status_code == 200


def test_detector_websocket_rejects_anonymous_connections_and_requires_key_for_events(
    client, monkeypatch
):
    detector_key = "unique-test-detector-key"
    monkeypatch.setattr(settings, "DETECTOR_API_KEY", detector_key)
    monkeypatch.setattr(websocket_router, "process_detection_event", lambda *args, **kwargs: None)

    with pytest.raises(WebSocketDisconnect):
        with client.websocket_connect("/api/ws"):
            pass

    with client.websocket_connect(
        "/api/ws",
        headers={"Authorization": f"Bearer {detector_key}"},
    ) as socket:
        socket.receive_json()
        socket.send_json({"event_type": "truck_present", "camera_id": 1})
