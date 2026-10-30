@echo off
title Breezy - Master Audio Launcher
color 0b
cls
echo ======================================================================
echo             B R E E Z Y   M A S T E R   A U D I O
echo                     High-Res Music Streamer
echo ======================================================================
echo.
echo [*] Checking GitHub for latest updates...
git pull origin main
if %errorlevel% neq 0 (
    echo [!] Notice: Git check finished or operating offline.
)
echo.
echo [*] Verifying application runtime packages...
call npm install --prefer-offline --no-audit
echo.
echo [*] Starting Breezy Local Master Audio Engine...
start "" msedge --app=http://127.0.0.1:5173 --name="Breezy"
call npm run dev
pause
