@echo off
chcp 65001 >nul
echo ========================================
echo   DELTAGARPORTALEN - START
echo ========================================
echo.

echo [1/3] Stoppar gamla processer...
taskkill /F /IM node.exe >nul 2>&1
timeout /t 2 >nul
echo OK
echo.

echo [2/3] Startar servrar...
start "SERVER" cmd /k "cd /d C:\laragon\www\deltagarportal\server && npx tsx src/index.ts"
timeout /t 3 >nul
start "AI" cmd /k "cd /d C:\laragon\www\deltagarportal\server\ai && node server.js"
timeout /t 3 >nul
start "WEBB" cmd /k "cd /d C:\laragon\www\deltagarportal\client && npx vite --port 3000"

echo [3/3] Vantar...
timeout /t 10 >nul

echo.
echo Oppnar webblasaren...
start http://localhost:3000/deltagarportalen/

echo.
echo ========================================
echo KLART!
echo ========================================
echo.
echo URL: http://localhost:3000/deltagarportalen/
echo Login: demo@demo.se / demo123
echo.
pause
