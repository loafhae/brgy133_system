# Vision-Trak 133 - Official Barangay Deployment & Implementation Guide
**Multi-Platform Barangay Announcement and Garbage Collection Notifier using IoT Technology**  
*Target Deployment: Barangay 133, Tondo, Manila*

---

## 1. System Overview & Deployment Topology

The **Vision-Trak 133** system is designed for community deployment in **Barangay 133, Tondo, Manila**. It replaces manual and unreliable communication methods with a centralized, automated platform:

1. **AI Garbage Truck Detection (IoT Layer)**: IP CCTV cameras / Raspberry Pi edge devices stream live video of key collection streets. When a waste collection truck enters the calibrated detection zone (ROI), the YOLOv8 / NCNN AI model identifies it and triggers real-time alerts.
2. **Centralized Backend & Database**: FastAPI and MariaDB running on the Barangay Hall server manage user accounts, roles, verified resident databases, announcements, feedback, and detection logs.
3. **Multi-Platform Access**:
   - **Barangay Officials / Staff**: Access the administrative dashboard over the configured HTTPS domain to post announcements, approve residents, and resolve concerns. The live camera stream is restricted to the server host.
   - **Residents**: Access the responsive Web Portal or Flutter Mobile App over standard mobile data or local Wi-Fi to receive truck alerts, view official announcements, and submit community feedback.

```
                      +------------------------------------------+
                      |         Physical Street Cameras          |
                      |   (Barangay 133 Key Street Locations)    |
                      +--------------------+---------------------+
                                           | RTSP / IP Stream
                                           v
+------------------------------------------------------------------------------------+
|                         BARANGAY 133 HALL SERVER PC                                |
|                                                                                    |
|  +---------------------+   +---------------------+   +--------------------------+  |
|  |     MariaDB/MySQL   |   |   FastAPI Backend   |   |   YOLOv8 AI Detector     |  |
|  |   (Database: 3306)  |<->|   (Port 8000)       |<--|   (detector.py: 8080)    |  |
|  +---------------------+   +----------+----------+   +--------------------------+  |
|                                       |                                            |
|                                       | Serves Built React SPA (dist)              |
+---------------------------------------+--------------------------------------------+
                                        |
               +------------------------+------------------------+
               |                                                 |
               v (Local LAN)                                     v (Internet via Cloudflare)
+-------------------------------+              +-------------------------------------+
|   Barangay Hall Workstations  |              |        Barangay 133 Residents       |
|  (Captain / Secretary / Desk) |              |      (Smartphones / Web Browsers)   |
|   http://192.168.1.xxx:8000   |              |    https://visiontrak.ragetech.dev  |
+-------------------------------+              +-------------------------------------+
```

---

## 2. Hardware & Network Prerequisites

### A. Barangay Hall Server PC
- **Operating System**: Windows 10 / 11 (64-bit)
- **Processor**: Intel Core i5 (8th Gen or newer) / AMD Ryzen 5 or higher
- **RAM**: Minimum 8 GB (16 GB recommended for concurrent AI inference & database handling)
- **Storage**: SSD with at least 50 GB free space
- **Power**: **Uninterruptible Power Supply (UPS)** with at least 15–30 minutes battery reserve to protect against power surges and sudden blackouts.

### B. CCTV & Network Hardware
- **IP Cameras**: ONVIF/RTSP compliant 1080p IP CCTV cameras (e.g., Hikvision, Dahua, TP-Link Tapo, or Raspberry Pi Camera Module).
- **Network Switch / PoE**: Minimum 100 Mbps PoE switch to power and network cameras to the local router.
- **Internet Connection**: Standard broadband (PLDT, Converge, or Globe) at the Barangay Hall. Static public IP is **not** required because the system utilizes encrypted Cloudflare Tunnels.

---

## 3. Step-by-Step Server Setup on the Barangay PC

### Step 1: Install Software Prerequisites
1. **Python 3.10**: Download and install [Python 3.10](https://www.python.org/downloads/release/python-31011/).
   > [!IMPORTANT]
   > During installation, check the box: **"Add Python to PATH"** and install the Python Launcher (`py`).
2. **Node.js LTS**: Download and install [Node.js LTS](https://nodejs.org/) (for initial React portal compilation).
3. **XAMPP / MariaDB**: Download and install [XAMPP](https://www.apachefriends.org/). Ensure MySQL is installed at `C:\xampp`.

### Step 2: Create the Database and Application Account
Do not run the application as MySQL `root`. In the MariaDB/MySQL administrator console, create the database and a separate account that can access only that database. Replace the password placeholder with a unique password:
```sql
CREATE DATABASE vision_trak CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;
CREATE USER 'vision_trak_app'@'127.0.0.1' IDENTIFIED BY '<unique-database-password>';
GRANT ALL PRIVILEGES ON vision_trak.* TO 'vision_trak_app'@'127.0.0.1';
```
- Copy `backend\.env.example` to `backend\.env`, then set the database account, password, sender email, SMTP app password, domain-only HTTPS CORS origin, and two independent random secrets. Generate each secret separately with:
  ```powershell
  py -3.10 -c "import secrets; print(secrets.token_urlsafe(48))"
  ```
- Replace the previously hard-coded detector key with its own new secret. Never reuse the JWT signing key or database password. Keep `backend\.env` private; it is excluded from source control.
- The database and account must exist before startup. The backend verifies access and creates/upgrades application tables using the restricted account.
- There is no seeded administrator or default password. Back up the database before the first deployment: the resident schema migration moves legacy addresses and eligible resident emails into the current schema.
- Resident registration and resident-record creation require a Philippine mobile number. Local `09XXXXXXXXX` and international `+639XXXXXXXXX` formats are accepted and stored in canonical `+639XXXXXXXXX` format.

### Step 3: Build and Bootstrap the First Administrator
Open the project directory:
```
brgy133_system\RASPY_Files_and_Backend
```
Run:
```bat
deploy_barangay.bat
```
The script installs the backend and detector dependencies, runs `npm ci` against the lockfile, and builds the React production bundle. It then starts the backend and prompts for access mode. Choose **Localhost Only** for the first run. After the backend reports healthy, open a second PowerShell window in the `backend` folder and run:
```powershell
.\venv\Scripts\python.exe -m bootstrap_admin
```
Enter the administrator username, email, name, and a unique password of at least 14 characters when prompted. The password is not echoed or written to the deployment files. Keep the email account accessible for security verification. Stop the first launcher with `Q` after creating the account.

Start `deploy_barangay.bat` again and choose the configured domain only after its Cloudflare route points to `http://127.0.0.1:8000`. The launcher uses Uvicorn without reload, serves the built React portal from the backend, validates production settings, and checks `/healthz`; it refuses to take over occupied ports. Public API documentation is disabled. On Windows x64 with Python 3.10, the detector requirements install a pinned NCNN binding; other platforms may require a platform-specific NCNN build. The optional detector is local-only and listens on loopback port `8080`; detector event endpoints require `DETECTOR_API_KEY`, which the production launcher passes to the detector process.

### Authentication Session Timeout
Sessions end after **15 minutes without activity** and have an **8-hour absolute lifetime**, even if active. The backend enforces and audits session expiry and logout; signing in creates a fresh server-side session. The web portal stores its session in an HttpOnly, Secure, SameSite cookie instead of browser-accessible storage. Flutter continues using bearer tokens with the same server-enforced limits.

Require HTTPS at the public edge: enable **Always Use HTTPS** for the Cloudflare zone and keep `REQUIRE_HTTPS=true` and `SESSION_COOKIE_SECURE=true`. The API redirects public HTTP requests to HTTPS and adds HSTS to HTTPS responses. The production API binds to `127.0.0.1`, so it is reachable through the configured Cloudflare route or on the server itself, not directly from other LAN devices.

For a public deployment, `CORS_ORIGINS` must contain only exact HTTPS origins, for example `["https://visiontrak.ragetech.dev"]`. Do not include localhost or wildcard origins. Production startup validates database credentials, both random secrets, SMTP configuration, HTTPS settings, and the CORS allow-list before starting.

Email OTP step-up is required before changing account/profile security details, changing a password, or creating/updating/deleting privileged user accounts and system settings. Configure working `SMTP_EMAIL` and `SMTP_APP_PASSWORD` values in the backend `.env`; MFA and password recovery fail closed if email delivery is unavailable, and OTP codes are not written to debug files. MFA codes expire after 5 minutes and are limited to five attempts. Accounts need an email address to use these protected actions.

To adjust policy, set positive `IDLE_TIMEOUT_MINUTES` and `SESSION_ABSOLUTE_TIMEOUT_MINUTES` values in the backend `.env`, then restart the backend. Review the values periodically against the barangay's risk and usability needs. All currently signed-in users must authenticate again when this update is deployed.

---

## 4. Configuring Physical Barangay Cameras (CCTV)

Camera feeds and street zones are configured through the local `cameras.json`. The current local camera configuration contains RTSP credentials: rotate those camera passwords before public deployment, keep `cameras.json` private on the server, and never include it in a source or release archive. Use [cameras.example.json](./cameras.example.json) as a credential-free template. Captured frames are not publicly served; snapshot downloads require an authenticated official or super administrator account.

### Step 1: Edit `cameras.json`
Open `cameras.json` in a text editor (Notepad, VS Code):
```json
[
  {
    "id": 1,
    "name": "Cam 1 - Main Street Entrance",
    "source": "rtsp://<username>:<password>@<camera-ip>:554/Streaming/Channels/101",
    "roi_coords": [[6, 370], [912, 303], [927, 1066], [6, 1074]]
  },
  {
    "id": 2,
    "name": "Cam 2 - Side Loading Area",
    "source": "rtsp://<username>:<password>@<camera-ip>:554/Streaming/Channels/101",
    "roi_coords": [[100, 400], [800, 350], [850, 950], [80, 980]]
  }
]
```
> [!TIP]
> - Replace the `source` field with your camera's real RTSP URL.
> - Common RTSP URL formats:
>   - **Hikvision**: `rtsp://<user>:<pass>@<ip>:554/Streaming/Channels/101`
>   - **Dahua**: `rtsp://<user>:<pass>@<ip>:554/cam/realmonitor?channel=1&subtype=0`
>   - **TP-Link Tapo**: `rtsp://<user>:<pass>@<ip>:554/stream1`
>   - **Local Video / Test**: `"04.mp4"` or `"02.mp4"`

### Step 2: Calibrate Street Detection Zone (ROI)
To define where the garbage truck passes so cars or pedestrians do not trigger false alarms:
1. Run `roi_config.py`:
   ```powershell
   backend\venv\Scripts\python.exe roi_config.py
   ```
2. Enter the camera RTSP URL or video filename.
3. Left-click around the street/collection area on the live video window to draw the polygon zone.
4. Press `S` or `Enter` to save the coordinates.
5. Paste the generated `roi_coords` into `cameras.json`.

---

## 5. Network Access & Resident Rollout

### A. Access on the Barangay Hall Server
The application is bound to loopback. On the server itself, open:
  ```
  http://127.0.0.1:8000
  ```
Other devices should use the HTTPS domain through Cloudflare; the backend is not exposed directly to the LAN.

### B. Public Internet Access for Residents
When running `deploy_barangay.bat`, choose the configured **ragetech.dev domain**. Its Cloudflare Tunnel must route to `http://127.0.0.1:8000`, and public DNS/TLS and **Always Use HTTPS** must already be configured. A Quick Tunnel is temporary and only for controlled smoke testing.
- **Web Portal URL**: `https://visiontrak.ragetech.dev`
- **Flutter app**: build with `--dart-define=API_BASE_URL=https://visiontrak.ragetech.dev/api` when using a different API domain.
- **Features available to residents**:
  - Live garbage truck arrival alerts & departure timestamps.
  - View official announcements from the Barangay Captain and Council.
  - Submit complaints, waste collection issues, and community feedback.
  - Track the status of their submitted concerns.

---

## 6. Power Outage & Auto-Recovery Setup

To guarantee 24/7 uptime during power fluctuations or after a sudden brownout:

### 1. Enable Auto-Startup at Windows Sign-In
First complete one successful manual deployment and confirm the named Cloudflare route works. The auto-start shortcut launches the production services in noninteractive domain mode when the configured Windows user signs in:
Run:
```bat
setup_autostart.bat
```
Select **Option 1**. Windows must sign in to that user account; configure the MariaDB service to start automatically as well. Protect the Windows account and its saved credentials.

### 2. Configure PC BIOS for Auto-Power-On
1. Restart the Barangay PC and press `Delete` or `F2` to enter BIOS Setup.
2. Navigate to **Power Management** (or **Advanced ACPI Configuration**).
3. Find **"Restore AC Power Loss"** (or **"After Power Loss"**).
4. Change setting from `Power Off` to **`Power On`** (or `Last State`).
5. Save and exit (`F10`).
*Result: After a power interruption, Windows starts the computer. Vision-Trak starts when the configured user signs in; unattended startup requires a separately secured Windows sign-in policy.*

---

## 7. Standard Operating Procedures (SOP) for Barangay Staff

| Activity | Procedure | Role Responsible |
| :--- | :--- | :--- |
| **Initial Login** | Use the administrator account created with `python -m bootstrap_admin`; keep its password private and verify email delivery for MFA. | Super Admin |
| **Staff Accounts** | Go to **User Management** -> **Add User**. Create accounts for Barangay Secretary and Kagawad on Duty with appropriate roles. | Super Admin |
| **Resident Verification** | Go to **Residents** tab. Review newly registered residents, verify address/ID against the Barangay master list, and click **Approve**. | Barangay Secretary / Admin |
| **Posting Announcements** | Go to **Announcements** -> **Create Announcement**. Enter Title, Category (e.g., Garbage Collection, General Advisory, Health Advisory), and Content. Publish to broadcast instantly. | Barangay Officials |
| **Addressing Feedback** | Go to **Feedback & Concerns**. Review resident complaints (waste piles, delayed collection), update status (`In Progress` / `Resolved`), and reply with remarks. | Barangay Officials |
| **Monitoring Truck Alerts** | View the **Dashboard** or **Detection Logs**. Live camera feeds and detection confidence are displayed in real time. | Barangay Watch / Officer on Duty |

---

## 8. Maintenance & Troubleshooting Quick Reference

| Issue / Symptom | Probable Cause | Action |
| :--- | :--- | :--- |
| **Database connection error** | MariaDB/MySQL stopped, database missing, or application account lacks access | Check `DATABASE_HOST`, `DATABASE_PORT`, and the restricted account in `backend\.env`. Start MariaDB and confirm the `vision_trak` database exists. |
| **Camera stream says "Offline" or blank frame** | Camera disconnected from router / wrong IP / wrong password | Check camera PoE cable. Verify RTSP stream in VLC (`Media -> Open Network Stream`). Update `cameras.json`. |
| **Residents cannot access link outside Barangay Hall** | Cloudflare route disconnected, misconfigured, or internet down | Check internet and the configured route to `http://127.0.0.1:8000`; rerun `deploy_barangay.bat` and choose domain mode. |
| **False positive truck detection** | ROI zone covers non-street areas (e.g., billboards, roofs) | Run `roi_config.py` to tighten the polygon strictly around the road where the truck stops. |
