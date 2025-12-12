@echo off
echo ========================================
echo   Starting All ChatBot Services
echo ========================================
echo.

REM Đổi thư mục về thư mục gốc của dự án
cd /d "%~dp0"

REM Kiểm tra xem Python có được cài đặt không
python --version >nul 2>&1
if errorlevel 1 (
    echo [ERROR] Python is not installed or not in PATH
    pause
    exit /b 1
)

REM Kiểm tra xem uvicorn có được cài đặt không
python -c "import uvicorn" >nul 2>&1
if errorlevel 1 (
    echo [ERROR] uvicorn is not installed. Please install it: pip install uvicorn
    pause
    exit /b 1
)

echo [INFO] Starting Identity Service on port 9001...
start "Identity Service" cmd /k "cd BackEnd\identity_service && .venv\Scripts\activate && python -m uvicorn main:app --host 0.0.0.0 --port 9001 --reload"

timeout /t 2 /nobreak >nul

echo [INFO] Starting User Service on port 9000...
start "User Service" cmd /k "cd BackEnd\user_service && .venv\Scripts\activate && python -m uvicorn main:app --host 0.0.0.0 --port 9000 --reload"

timeout /t 2 /nobreak >nul

echo [INFO] Starting Email Service on port 9002...
start "Email Service" cmd /k "cd BackEnd\email_service && .venv\Scripts\activate && python -m uvicorn main:app --host 0.0.0.0 --port 9002 --reload"

timeout /t 2 /nobreak >nul

echo [INFO] Starting Chat Service on port 9003...
start "Chat Service" cmd /k "cd BackEnd\chat_service && .venv\Scripts\activate && python -m uvicorn main:app --host 0.0.0.0 --port 9003 --reload"

timeout /t 2 /nobreak >nul

echo.
echo ========================================
echo   All Services Started Successfully!
echo ========================================
echo.
echo Services running on:
echo   - Identity Service: http://localhost:9001
echo   - User Service:      http://localhost:9000
echo   - Email Service:     http://localhost:9002
echo   - Chat Service:      http://localhost:9003
echo.
echo Press any key to close this window...
echo (Note: Closing this window will NOT stop the services)
echo.
pause >nul

