@echo off
chcp 65001 >nul
echo ==========================================
echo  🤖 Deploy AI Cover Letter Edge Function
echo ==========================================
echo.

echo Kontrollerar Supabase CLI...
supabase --version >nul 2>&1
if errorlevel 1 (
    echo ❌ Supabase CLI är inte installerat!
    echo.
    echo Installera med:
    echo   npm install -g supabase
    echo.
    pause
    exit /b 1
)

echo.
echo 🚀 Deployar ai-cover-letter function...
supabase functions deploy ai-cover-letter --project-ref odcvrdkvzyrbdzvdrhkz

if errorlevel 1 (
    echo ❌ Deploy misslyckades!
    echo.
    echo Kontrollera:
    echo 1. Att du är inloggad: supabase login
    echo 2. Att projekt-ref är korrekt
    pause
    exit /b 1
)

echo.
echo ==========================================
echo  ✅ Deploy klar!
echo ==========================================
echo.
echo Testa funktionen i browsern.
pause
