@echo off
chcp 65001 >nul
echo ========================================
echo   FELSOEKNING - Deltagarportalen
echo ========================================
echo.

echo [1] Kollar om Node-processer kors...
tasklist | findstr "node.exe"
if errorlevel 1 (
    echo    INGA NODE-PROCESSER HITTADES - Det ar OK om vi ska starta om
echo.
) else (
    echo    Node-processer hittade - stoppar dessa forst...
    taskkill /F /IM node.exe >nul 2>&1
    timeout /t 2 >nul
    echo    Stoppade.
echo.
)

echo [2] Startar HUVUDSERVER (port 3001)...
start "SERVER" cmd /k "cd /d C:\laragon\www\deltagarportal\server && echo === SERVER LOG === && npx tsx src/index.ts"
timeout /t 3 >nul

echo [3] Startar AI-SERVER (port 3002)...
start "AI" cmd /k "cd /d C:\laragon\www\deltagarportal\server\ai && echo === AI LOG === && node server.js"
timeout /t 3 >nul

echo [4] Startar FRONTEND...
echo    Anvander Vite preview pa port 80
echo.
start "WEBB" cmd /k "cd /d C:\laragon\www\deltagarportal\client && echo === WEBB LOG === && npx vite preview --port 80"

echo.
echo ========================================
echo   VANTA 10 SEKUNDER...
echo ========================================
timeout /t 10 >nul

echo.
echo [5] Testar om servrarna svarar...
echo.

echo    Testar port 3001 (huvudserver)...
powershell -Command "try { Invoke-RestMethod -Uri 'http://localhost:3001/api/health' -TimeoutSec 3 | Out-Null; Write-Host '    ✅ Port 3001 OK' } catch { Write-Host '    ❌ Port 3001 svarar INTE' }"

echo    Testar port 3002 (AI-server)...
powershell -Command "try { Invoke-RestMethod -Uri 'http://localhost:3002/api/health' -TimeoutSec 3 | Out-Null; Write-Host '    ✅ Port 3002 OK' } catch { Write-Host '    ❌ Port 3002 svarar INTE' }"

echo    Testar port 80 (frontend)...
powershell -Command "try { Invoke-RestMethod -Uri 'http://localhost/deltagarportalen/' -TimeoutSec 3 -Method GET | Out-Null; Write-Host '    ✅ Port 80 OK' } catch { Write-Host '    ❌ Port 80 svarar INTE' }"

echo.
echo ========================================
echo   Kontrollera fonstren ovanfor fel!
echo ========================================
echo.
echo Om nagot visar "Cannot find module" eller radfel:
echo 1. Stang alla fonster
echo 2. Kor: cd server && npm install
echo 3. Starta om
echo.
pause
