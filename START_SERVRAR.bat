@echo off
chcp 65001 >nul
echo ╔══════════════════════════════════════════════════════════════╗
echo ║         STARTAR ALLA SERVRAR                                 ║
echo ╚══════════════════════════════════════════════════════════════╝
echo.

echo [1/3] Stoppar eventuella gamla Node-processer...
taskkill /F /IM node.exe 2>nul
timeout /t 3 /nobreak >nul
echo.

echo [2/3] Startar Huvudserver och AI-server...
start cmd /c "cd /d C:\laragon\www\deltagarportal\server && echo Vantar pa huvudserver... && npm run dev"
timeout /t 2 >nul
start cmd /c "cd /d C:\laragon\www\deltagarportal\server\ai && echo Vantar pa AI-server... && npm run dev"
timeout /t 2 >nul
start cmd /c "cd /d C:\laragon\www\deltagarportal && echo Vantar pa frontend... && npm run dev:client"

echo [3/3] Vantar pa att allt ska starta...
timeout /t 5 /nobreak >nul
echo.

echo ════════════════════════════════════════════════════════════════
echo   ✅ Alla servrar startas i separata fonster!
echo.
echo   Vanta ytterligare 10-15 sekunder...
echo.
echo   Sen kan du oppna: http://localhost:5173
echo ════════════════════════════════════════════════════════════════
echo.
pause
