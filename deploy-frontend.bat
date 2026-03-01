@echo off
chcp 65001 >nul
echo ==========================================
echo  🚀 DEPLOY - Deltagarportalen Frontend
echo ==========================================
echo.

REM Gå till client-mappen
cd /d "%~dp0client"

REM Bygg projektet
echo 📦 Bygger projektet...
call npm run build
if errorlevel 1 (
    echo ❌ Bygget misslyckades!
    pause
    exit /b 1
)

echo.
echo ✅ Bygget klart!
echo.

REM Kolla om det finns en deploy-konfiguration
if exist "..\deploy-package\*" (
    echo 📂 Kopierar till deploy-package...
    xcopy /E /I /Y "dist\*" "..\deploy-package\"
    echo ✅ Kopierat!
) else (
    echo ⚠️  Ingen deploy-package mapp hittades
    echo    Bygget finns i: client\dist\
)

echo.
echo ==========================================
echo  🎉 DEPLOY KLAR!
echo ==========================================
echo.
echo Nästa steg:
echo 1. Ladda upp dist\ till din hosting (Netlify/Vercel/annat)
echo 2. Eller kör: npx netlify deploy --prod --dir=dist
echo 3. Verifiera att https://dindomän.se fungerar
echo.
pause
