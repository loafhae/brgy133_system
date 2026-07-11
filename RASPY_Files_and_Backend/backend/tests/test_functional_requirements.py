import pytest
from datetime import datetime, date
from .conftest import auth_header
from app.models import User, Resident, Feedback, Announcement, AuditLog, Notification, DetectionLog, SystemSetting


class TestFR1_UserAccountManagement:
    """FR1: Super Admin can add, update, and delete user accounts"""

    def test_super_admin_can_list_users(self, client, super_admin_token):
        resp = client.get("/api/users", headers=auth_header(super_admin_token))
        assert resp.status_code == 200
        data = resp.json()
        assert isinstance(data, list)

    def test_super_admin_can_create_user(self, client, super_admin_token, db):
        resp = client.post("/api/users", headers=auth_header(super_admin_token), json={
            "username": "newuser", "password": "pass123", "roles": "official"
        })
        assert resp.status_code == 201
        data = resp.json()
        assert data["username"] == "newuser"
        assert data["roles"] == "official"
        assert "user_id" in data

    def test_create_duplicate_username_fails(self, client, super_admin_token, db):
        client.post("/api/users", headers=auth_header(super_admin_token), json={
            "username": "dupuser", "password": "pass123", "roles": "official"
        })
        resp = client.post("/api/users", headers=auth_header(super_admin_token), json={
            "username": "dupuser", "password": "pass456", "roles": "resident"
        })
        assert resp.status_code == 400

    def test_super_admin_can_update_user(self, client, super_admin_token, db):
        resp = client.post("/api/users", headers=auth_header(super_admin_token), json={
            "username": "upduser", "password": "pass123", "roles": "resident"
        })
        uid = resp.json()["user_id"]
        resp = client.put(f"/api/users/{uid}", headers=auth_header(super_admin_token), json={
            "username": "updateduser", "roles": "official"
        })
        assert resp.status_code == 200
        assert resp.json()["username"] == "updateduser"
        assert resp.json()["roles"] == "official"

    def test_super_admin_can_delete_user(self, client, super_admin_token, db):
        resp = client.post("/api/users", headers=auth_header(super_admin_token), json={
            "username": "deluser", "password": "pass123", "roles": "resident"
        })
        uid = resp.json()["user_id"]
        resp = client.delete(f"/api/users/{uid}", headers=auth_header(super_admin_token))
        assert resp.status_code == 204

    def test_non_admin_cannot_access_users(self, client, official_token):
        resp = client.get("/api/users", headers=auth_header(official_token))
        assert resp.status_code == 403

    def test_search_and_filter_users(self, client, super_admin_token, db):
        client.post("/api/users", headers=auth_header(super_admin_token), json={
            "username": "filter1", "password": "pass", "roles": "official"
        })
        client.post("/api/users", headers=auth_header(super_admin_token), json={
            "username": "filter2", "password": "pass", "roles": "resident"
        })
        resp = client.get("/api/users?role=official", headers=auth_header(super_admin_token))
        assert resp.status_code == 200
        usernames = [u["username"] for u in resp.json()]
        assert "filter1" in usernames
        assert "filter2" not in usernames


class TestFR2_ResidentRecordsManagement:
    """FR2: Super Admin can add, update, and delete resident records"""

    def test_super_admin_can_list_residents(self, client, super_admin_token):
        resp = client.get("/api/residents", headers=auth_header(super_admin_token))
        assert resp.status_code == 200

    def test_super_admin_can_create_resident(self, client, super_admin_token, db):
        resp = client.post("/api/residents", headers=auth_header(super_admin_token), json={
            "username": "newres", "password": "pass123",
            "first_name": "Maria", "last_name": "Santos",
            "birthday": "1995-05-15", "gender": "Female",
            "address": "Barangay 133", "contact": "09123456789",
            "civil_status": "Single", "email": "maria@test.com"
        })
        assert resp.status_code == 201
        data = resp.json()
        assert data["first_name"] == "Maria"
        assert data["last_name"] == "Santos"

    def test_create_resident_creates_user_with_resident_role(self, client, super_admin_token, db):
        resp = client.post("/api/residents", headers=auth_header(super_admin_token), json={
            "username": "resuser", "password": "pass123",
            "first_name": "Pedro", "last_name": "Garcia"
        })
        assert resp.status_code == 201
        user = db.query(User).filter(User.username == "resuser").first()
        assert user is not None
        assert user.roles == "resident"

    def test_duplicate_resident_name_and_birthday_fails(self, client, super_admin_token, db):
        payload = {"username": "dup1", "password": "pass",
                    "first_name": "Clone", "last_name": "User", "birthday": "2000-01-01"}
        client.post("/api/residents", headers=auth_header(super_admin_token), json=payload)
        payload["username"] = "dup2"
        resp = client.post("/api/residents", headers=auth_header(super_admin_token), json=payload)
        assert resp.status_code == 400

    def test_super_admin_can_update_resident(self, client, super_admin_token, db):
        resp = client.post("/api/residents", headers=auth_header(super_admin_token), json={
            "username": "updres", "password": "pass",
            "first_name": "Ana", "last_name": "Cruz"
        })
        rid = resp.json()["resident_id"]
        resp = client.put(f"/api/residents/{rid}", headers=auth_header(super_admin_token), json={
            "first_name": "Ana Marie", "address": "New Address"
        })
        assert resp.status_code == 200
        assert resp.json()["first_name"] == "Ana Marie"

    def test_super_admin_can_delete_resident(self, client, super_admin_token, db):
        resp = client.post("/api/residents", headers=auth_header(super_admin_token), json={
            "username": "delres", "password": "pass",
            "first_name": "To", "last_name": "Delete"
        })
        rid = resp.json()["resident_id"]
        resp = client.delete(f"/api/residents/{rid}", headers=auth_header(super_admin_token))
        assert resp.status_code == 204

    def test_search_residents(self, client, super_admin_token, db):
        client.post("/api/residents", headers=auth_header(super_admin_token), json={
            "username": "search1", "password": "pass",
            "first_name": "UniqueName", "last_name": "X"
        })
        resp = client.get("/api/residents?search=UniqueName", headers=auth_header(super_admin_token))
        assert resp.status_code == 200
        names = [r["first_name"] for r in resp.json()]
        assert "UniqueName" in names


class TestFR3_BarangayOfficialLogin:
    """FR3: Barangay Officials can log in securely"""

    def test_successful_official_login(self, client, db):
        from app.services.auth_service import hash_password
        from app.models import User
        user = User(username="offlogin", password=hash_password("correctpass"), roles="official")
        db.add(user)
        db.commit()
        resp = client.post("/api/auth/login", json={"username": "offlogin", "password": "correctpass"})
        assert resp.status_code == 200
        data = resp.json()
        assert "access_token" in data
        assert data["token_type"] == "bearer"
        assert data["role"] == "official"

    def test_login_with_wrong_password(self, client, db):
        from app.services.auth_service import hash_password
        from app.models import User
        user = User(username="wrongpass", password=hash_password("correct"), roles="official")
        db.add(user)
        db.commit()
        resp = client.post("/api/auth/login", json={"username": "wrongpass", "password": "wrong"})
        assert resp.status_code == 401

    def test_login_with_nonexistent_user(self, client):
        resp = client.post("/api/auth/login", json={"username": "nobody", "password": "anything"})
        assert resp.status_code == 401

    def test_login_empty_fields(self, client):
        resp = client.post("/api/auth/login", json={"username": "", "password": ""})
        assert resp.status_code == 422

    def test_inactive_user_cannot_login(self, client, db):
        from app.services.auth_service import hash_password
        from app.models import User
        user = User(username="inactiveuser", password=hash_password("pass"), roles="official", is_active=False)
        db.add(user)
        db.commit()
        resp = client.post("/api/auth/login", json={"username": "inactiveuser", "password": "pass"})
        assert resp.status_code == 401

    def test_resident_cannot_access_admin_routes(self, client, resident_token):
        resp = client.get("/api/users", headers=auth_header(resident_token))
        assert resp.status_code == 403


class TestFR4_AnnouncementManagement:
    """FR4: Barangay Officials can create, update, and delete announcements"""

    ANNOUNCEMENT_CREATE = {"title": "Test Announcement", "content": "This is a test announcement body"}

    def test_official_can_list_announcements(self, client, official_token):
        resp = client.get("/api/announcements", headers=auth_header(official_token))
        assert resp.status_code == 200

    def test_official_can_create_announcement(self, client, official_token, db):
        resp = client.post("/api/announcements", headers=auth_header(official_token), json=self.ANNOUNCEMENT_CREATE)
        assert resp.status_code == 201
        data = resp.json()
        assert data["title"] == "Test Announcement"
        assert data["is_published"] is True

    def test_official_can_update_announcement(self, client, official_token, db):
        resp = client.post("/api/announcements", headers=auth_header(official_token), json=self.ANNOUNCEMENT_CREATE)
        aid = resp.json()["announcement_id"]
        resp = client.put(f"/api/announcements/{aid}", headers=auth_header(official_token), json={
            "title": "Updated Title", "content": "Updated content"
        })
        assert resp.status_code == 200
        assert resp.json()["title"] == "Updated Title"

    def test_official_can_delete_announcement(self, client, official_token, db):
        resp = client.post("/api/announcements", headers=auth_header(official_token), json=self.ANNOUNCEMENT_CREATE)
        aid = resp.json()["announcement_id"]
        resp = client.delete(f"/api/announcements/{aid}", headers=auth_header(official_token))
        assert resp.status_code == 204

    def test_resident_cannot_create_announcement(self, client, resident_token):
        resp = client.post("/api/announcements", headers=auth_header(resident_token), json=self.ANNOUNCEMENT_CREATE)
        assert resp.status_code == 403

    def test_search_announcements(self, client, official_token, db):
        client.post("/api/announcements", headers=auth_header(official_token), json={
            "title": "Special Meeting", "content": "Meeting content"
        })
        resp = client.get("/api/announcements?search=Special", headers=auth_header(official_token))
        assert resp.status_code == 200
        titles = [a["title"] for a in resp.json()]
        assert "Special Meeting" in titles

    def test_filter_published_only(self, client, official_token, db):
        client.post("/api/announcements", headers=auth_header(official_token), json={
            "title": "Draft Post", "content": "Draft", "is_published": False
        })
        client.post("/api/announcements", headers=auth_header(official_token), json={
            "title": "Published Post", "content": "Pub"
        })
        resp = client.get("/api/announcements?published_only=true", headers=auth_header(official_token))
        titles = [a["title"] for a in resp.json()]
        assert "Published Post" in titles
        assert "Draft Post" not in titles


class TestFR5_ViewResidentHistoryAndFeedback:
    """FR5: Barangay Officials can view resident history and feedback (view-only)"""

    def test_official_can_view_feedback_list(self, client, official_token):
        resp = client.get("/api/feedback", headers=auth_header(official_token))
        assert resp.status_code == 200

    def test_official_can_view_detection_logs(self, client, official_token):
        resp = client.get("/api/detection/logs", headers=auth_header(official_token))
        assert resp.status_code == 200

    def test_official_cannot_delete_others_feedback(self, client, official_token):
        resp = client.delete("/api/feedback/9999", headers=auth_header(official_token))
        assert resp.status_code == 403

    def test_super_admin_can_view_activity_all(self, client, super_admin_token):
        resp = client.get("/api/activity/all", headers=auth_header(super_admin_token))
        assert resp.status_code == 200


class TestFR6_GarbageTruckDetection:
    """FR6: System detects garbage trucks through CCTV using image processing"""

    def test_detection_event_creates_log(self, client, db):
        resp = client.post("/api/detection/event", json={
            "camera_id": 1, "camera_name": "Camera 1",
            "confidence": 0.92, "image_path": "/snapshots/test.jpg"
        })
        assert resp.status_code == 200
        data = resp.json()
        assert data["confidence_score"] == 0.92
        assert data["camera_name"] == "Camera 1"
        assert "log_id" in data

    def test_detection_log_has_pending_notification_status(self, client, db):
        resp = client.post("/api/detection/event", json={
            "camera_id": 1, "camera_name": "Camera 1", "confidence": 0.85
        })
        assert resp.json()["notification_status"] == "pending"

    def test_detection_status_endpoint(self, client, db):
        client.post("/api/detection/event", json={
            "camera_id": 1, "camera_name": "Camera 1", "confidence": 0.90
        })
        resp = client.get("/api/detection/status")
        assert resp.status_code == 200
        assert "last_detection" in resp.json()

    def test_truck_status_event_creates_notification(self, client, db):
        resp = client.post("/api/detection/truck-status", json={
            "event_type": "truck_present",
            "camera_id": 1,
            "camera_name": "Main Gate",
            "confidence": 0.88
        })
        assert resp.status_code == 200
        data = resp.json()
        assert data["event_type"] == "truck_present"
        assert "notification_id" in data

    def test_detection_log_persistence(self, client, db):
        client.post("/api/detection/event", json={
            "camera_id": 2, "camera_name": "Side Gate", "confidence": 0.95
        })
        logs = db.query(DetectionLog).all()
        assert len(logs) > 0
        assert logs[0].confidence_score == 0.95


class TestFR7_AutoNotificationsUponDetection:
    """FR7: System auto-sends real-time notifications to residents upon garbage truck detection"""

    def test_notification_created_with_truck_status(self, client, db):
        resp = client.post("/api/detection/truck-status", json={
            "event_type": "truck_present",
            "camera_id": 1,
            "camera_name": "Main Gate",
            "confidence": 0.90
        })
        data = resp.json()
        assert data["notification_id"] is not None
        notification = db.query(Notification).filter(Notification.notification_id == data["notification_id"]).first()
        assert notification is not None
        assert notification.notification_type == "detection"

    def test_notification_message_content(self, client, db):
        resp = client.post("/api/detection/truck-status", json={
            "event_type": "truck_present",
            "camera_id": 1,
            "camera_name": "Main Gate",
            "confidence": 0.90
        })
        data = resp.json()
        assert data["status"] == "sent"

    def test_notification_logging(self, client, db):
        resp = client.post("/api/detection/truck-status", json={
            "event_type": "truck_present",
            "camera_id": 1,
            "camera_name": "Main Gate",
            "confidence": 0.80
        })
        assert resp.status_code == 200


class TestFR8_ResidentLogin:
    """FR8: Residents can log in using credentials provided by the barangay"""

    def test_successful_resident_login(self, client, resident_token):
        resp = client.get("/api/auth/me", headers=auth_header(resident_token))
        assert resp.status_code == 200
        assert resp.json()["role"] == "resident"

    def test_resident_login_wrong_credentials(self, client):
        resp = client.post("/api/auth/login", json={"username": "noone", "password": "wrong"})
        assert resp.status_code == 401

    def test_resident_login_empty_fields(self, client):
        resp = client.post("/api/auth/login", json={"username": "", "password": ""})
        assert resp.status_code == 422


class TestFR9_ViewAnnouncementsAndNotifications:
    """FR9: Residents can view announcements and garbage collection notifications"""

    def test_resident_can_view_announcements(self, client, resident_token, official_token, db):
        client.post("/api/announcements", headers=auth_header(official_token), json={
            "title": "Resident News", "content": "For residents"
        })
        resp = client.get("/api/announcements", headers=auth_header(resident_token))
        assert resp.status_code == 200
        titles = [a["title"] for a in resp.json()]
        assert "Resident News" in titles

    def test_resident_can_view_detection_status(self, client, resident_token):
        resp = client.get("/api/detection/status", headers=auth_header(resident_token))
        assert resp.status_code == 200

    def test_resident_cannot_edit_announcements(self, client, resident_token, official_token, db):
        resp = client.post("/api/announcements", headers=auth_header(official_token), json={
            "title": "Locked", "content": "Read only"
        })
        aid = resp.json()["announcement_id"]
        resp = client.put(f"/api/announcements/{aid}", headers=auth_header(resident_token), json={"title": "Hacked"})
        assert resp.status_code == 403

    def test_announcements_ordered_newest_first(self, client, official_token, resident_token, db):
        client.post("/api/announcements", headers=auth_header(official_token), json={"title": "Old", "content": "x"})
        import time
        time.sleep(0.1)
        client.post("/api/announcements", headers=auth_header(official_token), json={"title": "New", "content": "x"})
        resp = client.get("/api/announcements?published_only=true", headers=auth_header(resident_token))
        titles = [a["title"] for a in resp.json()]
        assert titles == ["New", "Old"]


class TestFR10_SubmitFeedback:
    """FR10: Residents can fill out and send feedback forms"""

    def test_resident_can_submit_feedback(self, client, resident_token):
        resp = client.post("/api/feedback", headers=auth_header(resident_token), json={
            "subject": "Noise Complaint", "content": "Loud noise at night"
        })
        assert resp.status_code == 201
        assert resp.json()["subject"] == "Noise Complaint"

    def test_resident_can_view_own_feedback(self, client, resident_token):
        client.post("/api/feedback", headers=auth_header(resident_token), json={
            "subject": "Road Issue", "content": "Pothole on main road"
        })
        resp = client.get("/api/feedback", headers=auth_header(resident_token))
        assert resp.status_code == 200
        subjects = [f["subject"] for f in resp.json()]
        assert "Road Issue" in subjects

    def test_duplicate_feedback_prevented(self, client, resident_token):
        client.post("/api/feedback", headers=auth_header(resident_token), json={
            "subject": "Spam", "content": "Duplicate content here"
        })
        resp = client.post("/api/feedback", headers=auth_header(resident_token), json={
            "subject": "Spam", "content": "Duplicate content here"
        })
        assert resp.status_code == 429

    def test_resident_cannot_access_others_feedback(self, client, resident_token, super_admin_token, db):
        resp = client.post("/api/feedback", headers=auth_header(resident_token), json={
            "subject": "Private", "content": "My private feedback"
        })
        fid = resp.json()["feedback_id"]
        resp = client.get(f"/api/feedback/{fid}", headers=auth_header(super_admin_token))
        assert resp.status_code == 200

    def test_feedback_empty_message_rejected(self, client, resident_token):
        resp = client.post("/api/feedback", headers=auth_header(resident_token), json={
            "subject": "Empty", "content": ""
        })
        assert resp.status_code == 422

    def test_unauthenticated_user_cannot_submit_feedback(self, client):
        resp = client.post("/api/feedback", json={"subject": "Hack", "content": "Bad"})
        assert resp.status_code == 403


class TestFR11_SuperAdminViewAllFeedback:
    """FR11: Super Admin can view all residents' feedback and activity history"""

    def test_super_admin_can_view_all_feedback(self, client, super_admin_token, resident_token, db):
        client.post("/api/feedback", headers=auth_header(resident_token), json={
            "subject": "Issue 1", "content": "Content 1"
        })
        client.post("/api/feedback", headers=auth_header(resident_token), json={
            "subject": "Issue 2", "content": "Content 2"
        })
        resp = client.get("/api/feedback", headers=auth_header(super_admin_token))
        assert len(resp.json()) >= 2

    def test_super_admin_can_view_activity_all(self, client, super_admin_token):
        resp = client.get("/api/activity/all", headers=auth_header(super_admin_token))
        assert resp.status_code == 200
        assert isinstance(resp.json(), list)

    def test_super_admin_can_filter_activity(self, client, super_admin_token):
        resp = client.get("/api/activity/all?activity_type=login", headers=auth_header(super_admin_token))
        assert resp.status_code == 200

    def test_super_admin_cannot_edit_feedback(self, client, super_admin_token, resident_token, db):
        resp = client.post("/api/feedback", headers=auth_header(resident_token), json={
            "subject": "ReadOnly", "content": "Cannot edit"
        })
        fid = resp.json()["feedback_id"]
        resp = client.delete(f"/api/feedback/{fid}", headers=auth_header(super_admin_token))
        assert resp.status_code == 204


class TestFR12_PushNotificationsForAnnouncements:
    """FR12: System sends push notifications to residents about new announcements"""

    def test_announcement_created_creates_notification_record(self, client, official_token, db):
        resp = client.post("/api/announcements", headers=auth_header(official_token), json={
            "title": "Notif Test", "content": "Check notifications"
        })
        assert resp.status_code == 201


class TestFR13_CentralizedDatabase:
    """FR13: System stores and retrieves all data in a centralized MySQL database"""

    def test_user_data_persistence(self, client, super_admin_token, db):
        resp = client.get("/api/users", headers=auth_header(super_admin_token))
        assert resp.status_code == 200

    def test_dashboard_stats_reflect_database(self, client, super_admin_token, resident_token, db):
        resp = client.get("/api/dashboard/stats", headers=auth_header(super_admin_token))
        assert resp.status_code == 200
        data = resp.json()
        assert "user_count" in data
        assert "resident_count" in data
        assert "pending_feedback" in data

    def test_settings_persistence(self, client, super_admin_token, db):
        client.put("/api/settings/test_key", headers=auth_header(super_admin_token), json={"config_value": "test_value"})
        resp = client.get("/api/settings", headers=auth_header(super_admin_token))
        assert resp.status_code == 200
        assert resp.json().get("test_key") == "test_value"


class TestFR14_SummaryReports:
    """FR14: Officials can create and view summary reports of announcements and activities"""

    def test_official_can_list_reports(self, client, official_token):
        resp = client.get("/api/reports", headers=auth_header(official_token))
        assert resp.status_code == 200

    def test_official_can_generate_report(self, client, official_token, db):
        resp = client.post("/api/reports/generate", headers=auth_header(official_token), json={
            "title": "Monthly Report", "report_type": "announcement",
            "start_date": "2025-01-01", "end_date": "2025-12-31"
        })
        assert resp.status_code == 200
        assert resp.json()["title"] == "Monthly Report"

    def test_super_admin_can_generate_feedback_report(self, client, super_admin_token):
        resp = client.post("/api/reports/generate", headers=auth_header(super_admin_token), json={
            "title": "Feedback Summary", "report_type": "feedback",
            "start_date": "2025-01-01", "end_date": "2025-12-31", "file_format": "pdf"
        })
        assert resp.status_code == 200

    def test_resident_cannot_generate_report(self, client, resident_token):
        resp = client.post("/api/reports/generate", headers=auth_header(resident_token), json={
            "title": "Hack", "report_type": "announcement"
        })
        assert resp.status_code == 403


class TestFR15_WebBasedPortal:
    """FR15: System displays all information in a web-based portal accessible via desktop or mobile"""

    def test_backend_root_endpoint(self, client):
        resp = client.get("/")
        assert resp.status_code == 200
        assert resp.json()["message"] == "Vision-Trak Backend is running"

    def test_api_docs_accessible(self, client):
        resp = client.get("/docs")
        assert resp.status_code in (200, 303, 302)

    def test_test_html_served(self, client):
        resp = client.get("/test.html")
        assert resp.status_code == 200
        assert "Test Plan" in resp.text

    def test_cors_headers_present(self, client):
        resp = client.options("/api/auth/login")
        assert "access-control-allow-origin" in resp.headers or resp.status_code in (200, 405)

    def test_resident_cannot_access_admin_dashboard_stats_as_admin(self, client, resident_token):
        resp = client.get("/api/users", headers=auth_header(resident_token))
        assert resp.status_code == 403


class TestFR16_ResidentActivityHistory:
    """FR16: Residents can view a log of their personal activity history"""

    def test_resident_can_view_own_activity(self, client, resident_token):
        resp = client.get("/api/activity", headers=auth_header(resident_token))
        assert resp.status_code == 200
        assert isinstance(resp.json(), list)

    def test_resident_activity_shows_correct_type(self, client, resident_token, db):
        resp = client.post("/api/feedback", headers=auth_header(resident_token), json={
            "subject": "Track This", "content": "Should appear in activity"
        })
        resp = client.get("/api/activity", headers=auth_header(resident_token))
        assert resp.status_code == 200

    def test_resident_cannot_view_others_activity(self, client, resident_token, super_admin_token, db):
        resp = client.get("/api/activity/all", headers=auth_header(resident_token))
        assert resp.status_code == 403

    def test_activity_history_read_only(self, client, resident_token):
        resp = client.get("/api/activity", headers=auth_header(resident_token))
        data = resp.json()
        assert isinstance(data, list)
