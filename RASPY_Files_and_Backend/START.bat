@echo off
setlocal
title Barangay 133 - Vision-Trak START

set "ROOT_DIR=%~dp0"
set "VENV_PYTHON=%ROOT_DIR%backend\venv\Scripts\python.exe"
set "POWERSHELL_EXE=%SystemRoot%\System32\WindowsPowerShell\v1.0\powershell.exe"
set "STARTUP_FOLDER=%APPDATA%\Microsoft\Windows\Start Menu\Programs\Startup"
set "SHORTCUT_PATH=%STARTUP_FOLDER%\VisionTrak_Barangay133.lnk"

cls
echo ================================================================================
echo        BARANGAY 133, TONDO, MANILA - VISION-TRAK SYSTEM LAUNCHER
echo ================================================================================
echo.
echo   [1] Start Vision-Trak  (all services - normal daily use)
echo   [2] Enable  auto-start on Windows login
echo   [3] Disable auto-start on Windows login
echo   [4] Exit
echo.
echo ================================================================================
echo.

:: Guard: ensure setup has been done first
if not exist "%VENV_PYTHON%" (
    echo [ERROR] Setup has not been completed yet.
    echo         Run SETUP.bat first, then come back to START.bat.
    echo.
    pause
    exit /b 1
)

set "CHOICE="
set /p "CHOICE=Select an option (1-4, default: 1): "
if "%CHOICE%"=="" set "CHOICE=1"

if "%CHOICE%"=="1" goto :start_system
if "%CHOICE%"=="2" goto :enable_autostart
if "%CHOICE%"=="3" goto :disable_autostart
if "%CHOICE%"=="4" exit /b 0

echo Invalid choice. Please enter 1, 2, 3, or 4.
pause
exit /b 1

:: ---- Option 1: Start all services --------------------------------------------
:start_system
echo.
echo Starting Vision-Trak... (press Q in the dashboard window to stop all services)
echo.
powershell.exe -NoProfile -ExecutionPolicy Bypass -File "%ROOT_DIR%cloudflare_run.ps1"
if errorlevel 1 (
    echo.
    echo [ERROR] The system exited with an error. Check the messages above.
    echo         If the database is not running, start XAMPP/MariaDB first.
    echo.
    pause
)
exit 0

:: ---- Option 2: Enable auto-start --------------------------------------------
:enable_autostart
echo.
echo Configuring Vision-Trak to start automatically on Windows login...
"%POWERSHELL_EXE%" -NoProfile -Command "$wsh = New-Object -ComObject WScript.Shell; $sc = $wsh.CreateShortcut('%SHORTCUT_PATH%'); $sc.TargetPath = '%POWERSHELL_EXE%'; $sc.Arguments = '-NoProfile -ExecutionPolicy Bypass -WindowStyle Minimized -File ""%ROOT_DIR%cloudflare_run.ps1"" -Mode domain -LaunchDetector -NonInteractive'; $sc.WorkingDirectory = '%ROOT_DIR%'; $sc.WindowStyle = 7; $sc.Description = ''Vision-Trak 133 Auto-Launcher''; $sc.Save()"
if exist "%SHORTCUT_PATH%" (
    echo [OK] Auto-start enabled. Vision-Trak will launch when this user signs in.
) else (
    echo [ERROR] Could not create the auto-start shortcut.
)
echo.
pause
exit /b 0

:: ---- Option 3: Disable auto-start -------------------------------------------
:disable_autostart
echo.
if exist "%SHORTCUT_PATH%" (
    del /f /q "%SHORTCUT_PATH%"
    echo [OK] Auto-start disabled. Vision-Trak will no longer start on login.
) else (
    echo [INFO] Auto-start shortcut was not found - nothing to remove.
)
echo.
pause
exit /b 0
