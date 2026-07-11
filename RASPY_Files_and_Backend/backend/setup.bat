@echo off
title Vision-Trak Backend Setup
echo ====================================
echo   Vision-Trak Backend Setup (Windows)
echo ====================================
echo.

py -3.10 --version >nul 2>&1
if errorlevel 1 (
    echo [ERROR] Python 3.10 not found. Install Python 3.10 and add to PATH.
    pause
    exit /b 1
)

echo [1/5] Creating virtual environment...
if exist venv (
    echo       venv already exists, skipping.
) else (
    py -3.10 -m venv venv
    echo       venv created.
)

echo [2/5] Activating venv...
call venv\Scripts\activate.bat

echo [3/5] Installing dependencies...
pip install --upgrade pip >nul 2>&1
pip install -r requirements.txt
echo       Dependencies installed.

echo [4/5] Checking .env configuration...
if not exist .env (
    copy .env.example .env >nul
    echo       .env created from .env.example.
) else (
    echo       .env already exists, skipping.
)

echo [5/5] Creating directories...
if not exist uploads\detections mkdir uploads\detections
if not exist uploads\announcements mkdir uploads\announcements
if not exist uploads\feedback mkdir uploads\feedback
if not exist uploads\reports mkdir uploads\reports
if not exist backups mkdir backups
echo       Directories ready.

echo.
echo ====================================
echo   Setup Complete!
echo ====================================
echo.
echo   To start the server, run these commands:
echo.
echo   CMD:     venv\Scripts\activate ^&^& uvicorn app.main:app --reload
echo   PowerShell:  .\venv\Scripts\Activate.ps1 ^&^& uvicorn app.main:app --reload
echo.
echo   Then open: http://localhost:8000/docs
echo.
