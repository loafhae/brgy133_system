@echo off
setlocal
title Barangay 133 - Vision-Trak SETUP (Run Once)

set "ROOT_DIR=%~dp0"
set "BACKEND_DIR=%ROOT_DIR%backend"
set "FRONTEND_DIR=%ROOT_DIR%frontend\frontend-react"
set "VENV_DIR=%BACKEND_DIR%\venv"
set "VENV_PYTHON=%VENV_DIR%\Scripts\python.exe"
set "POWERSHELL_EXE=%SystemRoot%\System32\WindowsPowerShell\v1.0\powershell.exe"
set "STARTUP_FOLDER=%APPDATA%\Microsoft\Windows\Start Menu\Programs\Startup"
set "SHORTCUT_PATH=%STARTUP_FOLDER%\VisionTrak_Barangay133.lnk"

cls
echo ================================================================================
echo        BARANGAY 133, TONDO, MANILA - VISION-TRAK SYSTEM SETUP
echo ================================================================================
echo  Run this script ONCE before the system is first used, or after any major
echo  software update. It installs all dependencies and builds the web portal.
echo ================================================================================
echo.

:: ---- PRE-FLIGHT CHECKS --------------------------------------------------------

if not exist "%BACKEND_DIR%\.env" (
    echo [ERROR] backend\.env is missing.
    echo         Copy backend\.env.example to backend\.env and fill in all required
    echo         values before running setup.
    goto :failed
)

echo [CHECK] Verifying Python 3.10...
where py >nul 2>&1
if errorlevel 1 (
    echo [ERROR] The Python launcher ^(py.exe^) was not found.
    echo         Install Python 3.10 from https://python.org and enable "py launcher".
    goto :failed
)
py -3.10 --version >nul 2>&1
if errorlevel 1 (
    echo [ERROR] Python 3.10 was not found. Install it from https://python.org
    goto :failed
)
echo         [OK] Python 3.10 found.

echo [CHECK] Verifying Node.js / npm...
where npm >nul 2>&1
if errorlevel 1 (
    echo [ERROR] npm was not found. Install Node.js LTS from https://nodejs.org
    goto :failed
)
echo         [OK] Node.js / npm found.
echo.

:: ---- STEP 1: Python Virtual Environment --------------------------------------

echo [1/4] Setting up the Python virtual environment...
if not exist "%VENV_PYTHON%" (
    py -3.10 -m venv "%VENV_DIR%"
    if errorlevel 1 (
        echo [ERROR] Could not create the backend virtual environment.
        goto :failed
    )
    echo         [OK] Virtual environment created.
) else (
    echo         [OK] Virtual environment already exists - skipping.
)

:: ---- STEP 2: Python Dependencies ---------------------------------------------

echo [2/4] Installing backend Python dependencies...
"%VENV_PYTHON%" -m pip install --upgrade pip --quiet
"%VENV_PYTHON%" -m pip install -r "%BACKEND_DIR%\requirements.txt"
if errorlevel 1 (
    echo [ERROR] Backend dependency installation failed.
    goto :failed
)
echo         [OK] Backend dependencies installed.

if exist "%ROOT_DIR%requirements.txt" (
    echo         Installing AI detector Python dependencies...
    "%VENV_PYTHON%" -m pip install -r "%ROOT_DIR%requirements.txt"
    if errorlevel 1 (
        echo [ERROR] AI detector dependency installation failed.
        goto :failed
    )
    echo         [OK] Detector dependencies installed.
)

:: ---- STEP 3: Frontend Production Build ---------------------------------------

echo [3/4] Building the production web portal...
if not exist "%FRONTEND_DIR%\package-lock.json" (
    echo [ERROR] Frontend package-lock.json is missing.
    goto :failed
)
pushd "%FRONTEND_DIR%"
call npm ci
if errorlevel 1 (
    popd
    echo [ERROR] Frontend npm ci failed.
    goto :failed
)
call npm run build
if errorlevel 1 (
    popd
    echo [ERROR] Frontend production build failed.
    goto :failed
)
popd
echo         [OK] Production web portal built.

:: ---- STEP 4: Auto-Start Configuration (Optional) ----------------------------

echo [4/4] Windows Auto-Start configuration...
echo.
echo         Should Vision-Trak start automatically when this PC signs in?
echo         RECOMMENDED for the barangay deployment PC.
echo.
echo         [Y] Yes - configure auto-start (recommended)
echo         [N] No  - start manually via START.bat
echo.
set "AUTO_CHOICE="
set /p "AUTO_CHOICE=Your choice (Y/N, default: Y): "
if /i "%AUTO_CHOICE%"=="" set "AUTO_CHOICE=Y"

if /i "%AUTO_CHOICE%"=="Y" (
    "%POWERSHELL_EXE%" -NoProfile -Command "$wsh = New-Object -ComObject WScript.Shell; $sc = $wsh.CreateShortcut('%SHORTCUT_PATH%'); $sc.TargetPath = '%POWERSHELL_EXE%'; $sc.Arguments = '-NoProfile -ExecutionPolicy Bypass -WindowStyle Minimized -File ""%ROOT_DIR%cloudflare_run.ps1"" -Mode domain -LaunchDetector -NonInteractive'; $sc.WorkingDirectory = '%ROOT_DIR%'; $sc.WindowStyle = 7; $sc.Description = ''Vision-Trak 133 Auto-Launcher''; $sc.Save()"
    if exist "%SHORTCUT_PATH%" (
        echo         [OK] Auto-start shortcut installed.
    ) else (
        echo         [WARN] Could not create shortcut. Enable later via START.bat option 3.
    )
) else (
    echo         [SKIP] Auto-start not configured. Use START.bat to launch manually.
)

:: ---- DONE --------------------------------------------------------------------

echo.
echo ================================================================================
echo   SETUP COMPLETE - Vision-Trak is ready to deploy!
echo ================================================================================
echo.
echo   NEXT STEP: Double-click  START.bat  to launch all system services.
echo.
echo   To re-run setup after a software update, run SETUP.bat again - it
echo   skips any steps that are already complete.
echo ================================================================================
echo.
pause
exit /b 0

:failed
echo.
echo ================================================================================
echo   SETUP FAILED - Resolve the error above, then run SETUP.bat again.
echo ================================================================================
echo.
pause
exit /b 1
