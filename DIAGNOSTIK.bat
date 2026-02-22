@echo off
chcp 65001 >nul
echo ╔══════════════════════════════════════════════════════════════╗
echo ║         DIAGNOSTIK - Kontrollerar alla servrar               ║
echo ╚══════════════════════════════════════════════════════════════╝
echo.

echo [1/3] Kontrollerar om Node-processer kors...
echo.
tasklist | findstr "node.exe"
if errorlevel 1 (
    echo ⚠️  INGA NODE-PROCESSER HITTADES!
    echo.
    echo Du maste starta servrarna forst:
    echo   dubbelklicka: STARTA_OM_ALLT.bat
) else (
    echo ✅ Node-processer hittade
)
echo.

echo [2/3] Testar HUVUDSERVER (port 3001)...
powershell -Command "try { $r = Invoke-RestMethod -Uri 'http://localhost:3001/api/health' -Method GET -TimeoutSec 5; Write-Host '  ✅ Huvudserver OK:' $r.status } catch { Write-Host '  ❌ Huvudserver svarar inte' }"
echo.

echo [3/3] Testar AI-SERVER (port 3002)...
powershell -Command "try { $r = Invoke-RestMethod -Uri 'http://localhost:3002/api/health' -Method GET -TimeoutSec 5; Write-Host '  ✅ AI-server OK:' $r.status '- Modell:' $r.model } catch { Write-Host '  ❌ AI-server svarar inte' }"
echo.

echo ════════════════════════════════════════════════════════════════
echo   Om nagot saknas, kor: STARTA_OM_ALLT.bat
echo ════════════════════════════════════════════════════════════════
echo.
pause
