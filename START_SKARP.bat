@echo off
chcp 65001 >nul
echo ========================================
echo   DELTAGARPORTALEN - SKARP START
echo ========================================
echo.

echo [1/5] Stoppar gamla processer...
taskkill /F /IM node.exe >nul 2>&1
timeout /t 3 >nul
echo     OK
echo.

echo [2/5] Kontrollerar databas...
cd /d C:\laragon\www\deltagarportal\server
npx prisma migrate deploy >nul 2>&1
echo     OK
echo.

echo [3/5] Frontend redan byggd...
echo     OK (anvander dist/ mappen)
echo.

echo [4/5] Startar servrar...
start "HUVUD-3001" cmd /k "cd /d C:\laragon\www\deltagarportal\server && npx tsx src/index.ts"
timeout /t 5 >nul
start "AI-3002" cmd /k "cd /d C:\laragon\www\deltagarportal\server\ai && node server.js"
timeout /t 5 >nul
start "WEBB-80" cmd /k "cd /d C:\laragon\www\deltagarportal\client && npx vite preview --port 80"

echo.
echo ========================================
echo   VANTA 15 SEKUNDER...
echo ========================================
timeout /t 15 >nul

echo.
echo Oppnar webblasaren...
start http://localhost/deltagarportalen/

echo.
echo ========================================
echo   KLART! Systemet ar skarpt.
echo ========================================
echo.
echo   URL: http://localhost/deltagarportalen/
echo   API: http://localhost:3001
echo   AI:  http://localhost:3002
echo.
echo   Inloggning:
echo   demo@demo.se / demo123
echo.
pause
