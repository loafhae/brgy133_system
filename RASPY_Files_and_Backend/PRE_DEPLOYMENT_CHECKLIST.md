# Vision-Trak 133: Pre-Public-Deployment Checklist

Use this checklist before making Vision-Trak available to residents or the public. Complete the steps in order and record who verified each item and when. Do not treat a successful build or a passing test suite as proof that the live service is safe.

**Do not launch publicly until every required item is checked.** If a check fails or you cannot verify it, stop and resolve it first.

For installation and command details, see the [deployment guide](./BARANGAY_133_DEPLOYMENT_GUIDE.md).

## 1. Protect accounts, keys, and camera credentials

- [ ] Assign a deployment owner and a backup operator. Decide who can access the server, database, Cloudflare account, email account, camera accounts, and backups.
- [ ] Replace any credentials that have been shared, previously used, or included in a local configuration or earlier release. This includes camera/RTSP passwords and the detector API key. Do not reuse credentials between services.
- [ ] Create `backend\.env` from `backend\.env.example` on the deployment server. Keep the real file private; never send it in chat/email, put it in a source archive, or commit it.
- [ ] Set unique random values for `SECRET_KEY` and `DETECTOR_API_KEY`. Generate each separately in PowerShell:
  ```powershell
  py -3.10 -c "import secrets; print(secrets.token_urlsafe(48))"
  ```
  Do not paste the generated values into public documents, tickets, or logs.
- [ ] Set a unique database password of at least 16 characters. Use a dedicated non-root database account with access limited to the application database.
- [ ] Set the production values for `APP_ENV`, `SESSION_COOKIE_SECURE=true`, `REQUIRE_HTTPS=true`, and `CORS_ORIGINS`. CORS must contain only the exact HTTPS origin(s) used by this deployment; do not add `localhost`, LAN addresses, or `*`.
- [ ] Configure `SMTP_EMAIL` and `SMTP_APP_PASSWORD` with a working sender account. Use an app password or provider-approved credential, not an everyday mailbox password.
- [ ] Restrict access to the server and its files with individual Windows accounts, strong sign-in protection, automatic screen lock, current security updates, and permissions that limit access to `backend\.env`, camera configuration, uploads, and backups.
- [ ] Keep `cameras.json` only on the server. Create it from [cameras.example.json](./cameras.example.json), add the rotated camera credentials locally, and confirm it is not in the source/release package.
- [ ] Review who can view cameras and recorded snapshots. Limit access to authorized officials; establish an approved retention period and delete recordings that are no longer needed.

## 2. Prepare the database and a recovery plan

- [ ] Install and update MariaDB/MySQL on the deployment server. Do not expose the database port to the public internet.
- [ ] Create the application database and dedicated application account. Grant access only to that database; do not run the application as `root`.
- [ ] Back up any existing database before first startup. The application performs schema changes at startup; confirm the backup can be restored before proceeding.
- [ ] Configure the application database connection in `backend\.env`. Confirm the host, port, database name, username, and password match the server configuration.
- [ ] Define automatic database and file-backup schedules, encryption, off-server storage, access permissions, and retention. Include uploads and feedback attachments as well as the database.
- [ ] Complete a restore rehearsal using a separate test database or isolated server. Confirm that restored records and required files are readable and that the restored application starts.
- [ ] Record the recovery owner, backup location, recovery steps, and target recovery time. A backup job reporting success is not a substitute for a successful restore.

## 3. Check the server, network, and public endpoint

- [ ] Install supported, patched versions of Windows, Python 3.10, Node.js LTS, and MariaDB/MySQL. Confirm sufficient free disk space for database growth, logs, uploads, and backups.
- [ ] Check that the UPS, network equipment, cooling, and internet connection are stable. Decide how an operator will be notified if the server, tunnel, database, or disk fails.
- [ ] Configure the named Cloudflare Tunnel route to forward `visiontrak.ragetech.dev` to `http://127.0.0.1:8000`. Confirm public DNS and TLS are active and **Always Use HTTPS** is enabled.
- [ ] Ensure the application binds to loopback as configured and that Windows Firewall/router rules do not expose the API, development server, database, detector stream, or camera interfaces directly to the internet.
- [ ] Confirm that only the intended public hostname is routed to the app. Do not use a temporary Quick Tunnel for production.
- [ ] Verify that HTTP redirects to HTTPS, HTTPS certificates validate, and browser requests do not report mixed-content or certificate warnings.
- [ ] Confirm `/healthz` succeeds through the named HTTPS domain after startup. A health response confirms reachability, not correct application behavior.

## 4. Build and verify the application

From the project directory, run the production launcher and resolve every reported error:

```bat
deploy_barangay.bat
```

Before public mode, verify all of the following:

- [ ] The React production build completes successfully. Review the large-bundle warning and decide whether its load time is acceptable on residents' mobile connections.
- [ ] The backend validates the production environment and connects to the already-created application database.
- [ ] Public API documentation and development/reload servers are not enabled.
- [ ] The detector starts only when intended, receives the configured detector key from the production launcher, and binds its stream to loopback.
- [ ] Unauthenticated requests cannot access reports, feedback attachments, camera snapshots, backup files, or staff-only data.
- [ ] Detector event endpoints reject requests without the detector key and accept legitimate events from the configured detector.
- [ ] The named public route serves the correct application and returns the expected HTTPS health response.

Run the automated checks from the project directory before release:

```powershell
Push-Location .\backend
.\venv\Scripts\python.exe -m pytest tests -q
Pop-Location

Push-Location .\frontend\frontend-react
npm run build
Pop-Location

Push-Location .\frontend\flutter_app
flutter test
flutter analyze
Pop-Location
```

Also run Python compilation and PowerShell parsing checks if deployment scripts or backend code have changed. The automated suite does not exercise the actual Cloudflare account, production database, SMTP provider, cameras, or restore process.

## 5. Bootstrap and verify accounts

- [ ] Start in **Localhost Only** mode for the first setup. Do not enable public access before the production settings and domain checks pass.
- [ ] Create the first administrator with `backend\venv\Scripts\python.exe -m bootstrap_admin`. Use a unique password of at least 14 characters and an email inbox the operator can access.
- [ ] Sign in and verify that the administrator can receive the email security code. Confirm invalid, expired, and over-attempted codes are rejected.
- [ ] Create named staff accounts with only the roles they need. Do not share the administrator account or create generic shared accounts.
- [ ] Verify the administrator and staff can sign out, reset passwords, and recover access using the configured email process.
- [ ] Test resident registration and approval using test data, not real resident personal information. Confirm unapproved users cannot access protected features.
- [ ] Confirm each role has the intended access to announcements, feedback, reports, detection logs, camera images, and settings.
- [ ] Remove test accounts and test personal data before opening registration to residents.

## 6. Test real workflows and privacy controls

Use non-sensitive test accounts and controlled test content. Do not test with live resident records unless authorized.

- [ ] Create, publish, update, and remove a test announcement; verify resident-facing content is correct.
- [ ] Submit a test concern and attachment; verify staff can process it and unauthorized users cannot download it.
- [ ] Confirm staff-only reports and camera snapshots require authentication, and public/static file paths return not found or unauthorized.
- [ ] Verify invalid detector keys cannot create detections or notifications. Confirm a valid controlled detector event reaches the expected dashboard and notification flow.
- [ ] Test recovery from service restarts, a database restart, a dropped network/tunnel, and a detector restart. Confirm operators know how to identify and recover each failure.
- [ ] Review what personal data is collected, who can see it, how long it is retained, and how residents can request correction or deletion. Obtain any required organizational/legal approval and publish an appropriate privacy notice before registration.
- [ ] Post clear notice for camera monitoring and restrict collection to the approved purpose and locations. Confirm camera access, snapshot retention, and incident handling are approved by barangay leadership.
- [ ] Confirm users can access the portal on representative low-cost Android phones and slower mobile connections; verify text, forms, and error messages remain usable.

## 7. Final go/no-go and controlled launch

Do not switch to public domain mode until the owner can confirm each item:

- [ ] All secrets and camera passwords have been rotated and stored privately.
- [ ] Production settings pass validation; database, SMTP, HTTPS, and exact CORS origin work.
- [ ] The administrator can sign in and complete email verification; staff permissions have been checked.
- [ ] Database and file backups have been restored successfully in a rehearsal.
- [ ] The public HTTPS domain, health check, and required user workflows have been tested.
- [ ] Unauthorized access tests for reports, uploads, snapshots, backups, and detector events have passed.
- [ ] Privacy notice, camera notice, retention policy, support contact, and incident-response owner are ready.
- [ ] Monitoring and a rollback/disable-public-access procedure are available to the operator.

Then:

1. Start the production launcher in the configured domain mode.
2. Check the portal and `/healthz` from a device outside the server's network.
3. Run a short, supervised pilot with designated staff and a small test group.
4. Monitor application health, database capacity, email delivery, Cloudflare status, and logs. Do not put credentials, OTPs, or sensitive personal information in logs or support messages.
5. Expand access only after the pilot owner signs off. Keep a named operator available during the rollout.

If an exposed credential is suspected, disable the affected account/key, rotate it, review access logs, and notify the deployment owner before resuming service.

## Current validation snapshot

At the time this checklist was written, the code-level backend suite, Flutter tests/analyzer, React production build, and Python/PowerShell syntax checks passed. The React build reports a large JavaScript bundle warning. No live production database, SMTP provider, named Cloudflare route, physical camera, public user workflow, or backup-restore rehearsal has been verified here. Treat those as required operator checks, not completed work.
