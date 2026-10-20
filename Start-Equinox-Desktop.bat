@echo off
title Equinox Ledger — Desktop Engine
cd /d "%~dp0"
echo Starting Equinox Ledger local engine...
start /b cmd /c "npm run dev -- --port 5173 >nul 2>&1"
timeout /t 2 /nobreak >nul
start "" msedge --app="http://localhost:5173" --window-size=1380,880 2>nul || start "" chrome --app="http://localhost:5173" --window-size=1380,880 2>nul || start "" "http://localhost:5173"
exit
