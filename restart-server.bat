@echo off
chcp 65001 >nul
echo ╔══════════════════════════════════════════════════════════════╗
echo ║         Startar om Deltagarportalen                          ║
echo ╚══════════════════════════════════════════════════════════════╝
echo.

echo [1/3] Stoppar eventuella Node-processer...
taskkill /F /IM node.exe 2>nul
echo [OK] Processer stoppade
echo.

echo [2/3] Väntar 2 sekunder...
timeout /t 2 /nobreak >nul
echo.

echo [3/3] Startar servern...
echo.
echo ════════════════════════════════════════════════════════════════
echo   Frontend kommer att finnas på: http://localhost:5173
echo   Backend API kommer att finnas på: http://localhost:3001
echo ════════════════════════════════════════════════════════════════
echo.
echo Tryck Ctrl+C tva ganger for att stoppa.
echo.

call npm run dev
