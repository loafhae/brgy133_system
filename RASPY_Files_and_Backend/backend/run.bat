@echo off
setlocal enabledelayedexpansion
cd /d "%~dp0"
title Vision-Trak Backend Server

echo ====================================
echo   Vision-Trak Backend Server
echo ====================================
echo.

set PORT=8000

:: Kill any orphaned python.exe processes
taskkill /F /IM python.exe >nul 2>&1
timeout /t 2 /nobreak >nul

:: Get PC's local IP
for /f "tokens=2 delims=:" %%a in ('ipconfig ^| findstr /c:"IPv4" ^| findstr /v "127.0.0.1"') do set "PC_IP=%%a"
set PC_IP=%PC_IP: =%
if "%PC_IP%"=="" set PC_IP=127.0.0.1

echo   PC IP Address: %PC_IP%
echo   Server Port:   %PORT%
echo   Server URL:    http://%PC_IP%:%PORT%
echo   API Docs:      http://%PC_IP%:%PORT%/docs
echo.
echo   Flutter app API base: http://%PC_IP%:%PORT%/api
echo.

:: Start uvicorn using venv python
set VENV_PYTHON=%~dp0venv\Scripts\python.exe
if not exist "%VENV_PYTHON%" (
    echo [ERROR] venv not found at %VENV_PYTHON%
    echo Run setup.bat first to create the virtual environment.
    pause
    exit /b 1
)

echo Starting server on 0.0.0.0:%PORT% ...
echo.
"%VENV_PYTHON%" -m uvicorn app.main:app --host 0.0.0.0 --port %PORT% --reload --app-dir .
if errorlevel 1 (
    echo.
    echo [ERROR] Backend failed to start. Port %PORT% may be in use.
    pause
)
