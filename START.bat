@echo off
chcp 65001 >nul
echo ========================================
echo   STARTAR DELTAGARPORTALEN
echo ========================================
echo.
echo Stopp gamla processer...
taskkill /F /IM node.exe 2>nul
timeout /t 2 >nul

echo.
echo Startar HUVUDSERVER (port 3001)...
start "SERVER-3001" cmd /k "cd /d C:\laragon\www\deltagarportal\server && npm run dev"

echo Startar AI-SERVER (port 3002)...
start "AI-3002" cmd /k "cd /d C:\laragon\www\deltagarportal\server\ai && npm run dev"

echo Startar FRONTEND (port 5173)...
start "WEBB-5173" cmd /k "cd /d C:\laragon\www\deltagarportal && npm run dev:client"

echo.
echo ========================================
echo VANTA 15 SEKUNDER...
echo ========================================
timeout /t 15 >nul

echo.
echo Oppnar webblasaren...
start http://localhost:5173

echo.
echo KLART! Om det inte fungerar, kontrollera de tre fonstren ovanfor felmeddelanden.
pause
