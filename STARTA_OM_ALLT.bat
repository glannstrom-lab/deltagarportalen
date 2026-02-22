@echo off
chcp 65001 >nul
echo ╔══════════════════════════════════════════════════════════════╗
echo ║         STARTAR OM ALLA SERVRAR                              ║
echo ╚══════════════════════════════════════════════════════════════╝
echo.

echo [1/4] Stoppar gamla processer...
taskkill /F /IM node.exe 2>nul
timeout /t 2 /nobreak >nul
echo.

echo [2/4] Startar HUVUDSERVER (port 3001)...
start "Huvudserver" cmd /k "cd /d C:\laragon\www\deltagarportal\server && npm run dev"
timeout /t 3 /nobreak >nul
echo.

echo [3/4] Startar AI-SERVER (port 3002)...
start "AI-server" cmd /k "cd /d C:\laragon\www\deltagarportal\server\ai && npm run dev"
timeout /t 3 /nobreak >nul
echo.

echo [4/4] Startar FRONTEND (port 5173)...
start "Frontend" cmd /k "cd /d C:\laragon\www\deltagarportal && npm run dev:client"
timeout /t 3 /nobreak >nul
echo.

echo ════════════════════════════════════════════════════════════════
echo   ✅ Alla servrar startas i separata fonster!
echo.
echo   Vanta 10-15 sekunder sa startar allt upp.
echo.
echo   Frontend:  http://localhost:5173
echo   API:       http://localhost:3001
echo   AI:        http://localhost:3002
echo ════════════════════════════════════════════════════════════════
echo.
pause
