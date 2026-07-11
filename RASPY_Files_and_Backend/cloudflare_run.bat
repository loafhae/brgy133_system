@echo off
cd /d "%~dp0"
powershell -ExecutionPolicy Bypass -File "%~dp0cloudflare_run.ps1"
pause
