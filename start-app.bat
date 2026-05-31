@echo off
cd /d C:\Users\Administrator\bill-manager
REM Check if server already running
curl -s -o nul http://localhost:3000 2>nul
if %errorlevel% equ 0 goto :open
REM Start server in background
echo Starting server...
start /B npm start
timeout /t 4 /nobreak >nul
:open
start chrome --app=http://localhost:3000 --window-size=1200,800
