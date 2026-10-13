@echo off
setlocal
set "ROOT_DIR=%~dp0"
set "BACKEND_DIR=%ROOT_DIR%backend"
set "FRONTEND_DIR=%ROOT_DIR%frontend\frontend-react"
set "FLUTTER_DIR=%ROOT_DIR%frontend\flutter_app"
set "VENV_DIR=%BACKEND_DIR%\venv"
set "VENV_PYTHON=%VENV_DIR%\Scripts\python.exe"

:menu
echo.
echo ==========================================
echo   Vision-Trak - Local Development Launcher
echo ==========================================
echo   1. Install or update all dependencies
echo   2. Start backend and React admin portal
echo   3. Start Flutter resident app in Chrome
echo   4. Install dependencies and start everything
echo   5. Exit
echo.
set "MENU_CHOICE="
set /p "MENU_CHOICE=Choose an option (1-5): "

if "%MENU_CHOICE%"=="1" (
    set "START_ALL="
    goto install_python_dependencies
)
if "%MENU_CHOICE%"=="2" (
    set "START_ALL="
    goto start_admin_services
)
if "%MENU_CHOICE%"=="3" goto start_flutter
if "%MENU_CHOICE%"=="4" (
    set "START_ALL=1"
    goto install_python_dependencies
)
if "%MENU_CHOICE%"=="5" exit /b 0
echo Invalid choice. Please enter a number from 1 to 5.
goto menu

:install_python_dependencies
echo.
echo Installing backend and project Python dependencies...
where py >nul 2>&1
if errorlevel 1 (
    echo [ERROR] The Python launcher was not found. Install Python 3.10 and enable the Python launcher.
    goto install_failed
)
py -3.10 --version >nul 2>&1
if errorlevel 1 (
    echo [ERROR] Python 3.10 was not found. Install Python 3.10 before continuing.
    goto install_failed
)
if not exist "%VENV_PYTHON%" (
    echo Creating the backend virtual environment...
    py -3.10 -m venv "%VENV_DIR%"
    if errorlevel 1 (
        echo [ERROR] Could not create the backend virtual environment.
        goto install_failed
    )
)
"%VENV_PYTHON%" -m pip install -r "%BACKEND_DIR%\requirements.txt"
if errorlevel 1 (
    echo [ERROR] Backend dependency installation failed.
    goto install_failed
)
if exist "%ROOT_DIR%requirements.txt" (
    "%VENV_PYTHON%" -m pip install -r "%ROOT_DIR%requirements.txt"
    if errorlevel 1 (
        echo [ERROR] Project-level Python dependency installation failed.
        goto install_failed
    )
)

:install_react_dependencies
echo.
echo Installing React admin portal dependencies...
where npm >nul 2>&1
if errorlevel 1 (
    echo [ERROR] npm was not found. Install Node.js, then reopen this launcher.
    goto install_failed
)
if not exist "%FRONTEND_DIR%\package.json" (
    echo [ERROR] React package.json was not found at "%FRONTEND_DIR%".
    goto install_failed
)
pushd "%FRONTEND_DIR%"
npm install
set "INSTALL_RESULT=%ERRORLEVEL%"
popd
if not "%INSTALL_RESULT%"=="0" (
    echo [ERROR] React dependency installation failed.
    goto install_failed
)

:install_flutter_dependencies
echo.
echo Installing Flutter resident app dependencies...
where flutter >nul 2>&1
if errorlevel 1 (
    echo [ERROR] Flutter was not found. Install Flutter and add it to PATH.
    goto install_failed
)
if not exist "%FLUTTER_DIR%\pubspec.yaml" (
    echo [ERROR] Flutter pubspec.yaml was not found at "%FLUTTER_DIR%".
    goto install_failed
)
pushd "%FLUTTER_DIR%"
flutter pub get
set "INSTALL_RESULT=%ERRORLEVEL%"
popd
if not "%INSTALL_RESULT%"=="0" (
    echo [ERROR] Flutter dependency installation failed.
    goto install_failed
)
echo.
echo All declared dependencies are installed.
echo The optional NCNN Python bindings are platform-specific and are not installed by this script.
if defined START_ALL goto start_admin_services
pause
goto menu

:start_admin_services
if not exist "%VENV_PYTHON%" (
    echo [ERROR] Backend dependencies are not set up. Choose option 1 first.
    goto start_failed
)
where npm >nul 2>&1
if errorlevel 1 (
    echo [ERROR] npm was not found. Install Node.js, then reopen this launcher.
    goto start_failed
)
if not exist "%FRONTEND_DIR%\node_modules" (
    echo [ERROR] React dependencies are not set up. Choose option 1 first.
    goto start_failed
)
echo.
echo Starting the backend and React admin portal in separate windows...
echo Backend API: http://127.0.0.1:8000
echo API docs:    http://127.0.0.1:8000/docs
echo Admin portal: http://127.0.0.1:5173
echo.
echo MariaDB/MySQL must already be running and configured for the backend.
echo This launcher does not install, start, or modify the database.
start "Vision-Trak Backend" /D "%BACKEND_DIR%" "%VENV_PYTHON%" -m uvicorn app.main:app --host 127.0.0.1 --port 8000 --reload --reload-dir "%BACKEND_DIR%\app"
start "Vision-Trak Admin Portal" /D "%FRONTEND_DIR%" cmd.exe /k "npm run dev -- --host 127.0.0.1"
if defined START_ALL goto start_flutter
goto menu

:start_flutter
where flutter >nul 2>&1
if errorlevel 1 (
    echo [ERROR] Flutter was not found. Install Flutter and add it to PATH.
    goto start_failed
)
if not exist "%FLUTTER_DIR%\.dart_tool\package_config.json" (
    echo [ERROR] Flutter dependencies are not set up. Choose option 1 first.
    goto start_failed
)
echo.
echo Starting the Flutter resident app in Chrome...
echo The backend must be running at http://127.0.0.1:8000 for API features to work.
start "Vision-Trak Resident App" /D "%FLUTTER_DIR%" cmd.exe /k "flutter run -d chrome --web-hostname 127.0.0.1 --no-web-resources-cdn"
set "START_ALL="
goto menu

:install_failed
echo.
echo [ERROR] Setup stopped because a dependency could not be installed.
pause
set "START_ALL="
goto menu

:start_failed
echo.
echo [ERROR] One or more services could not be started. Review the message above.
pause
set "START_ALL="
goto menu
