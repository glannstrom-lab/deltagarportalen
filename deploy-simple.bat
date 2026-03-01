@echo off
echo ============================================================
echo  Deltagarportalen - Supabase Deploy (Forenklad)
echo ============================================================
echo.

echo Steg 1: Kontrollerar Supabase CLI...
supabase --version >nul 2>&1
if errorlevel 1 (
    echo ❌ Supabase CLI inte hittad.
    echo    Installera med: npm install -g supabase
    exit /b 1
)
echo ✅ Supabase CLI hittad

echo.
echo Steg 2: Deployar Edge Functions...
supabase functions deploy ai-cover-letter
supabase functions deploy cv-analysis
supabase functions deploy af-jobsearch
supabase functions deploy af-taxonomy
supabase functions deploy af-enrichments
supabase functions deploy af-jobed
supabase functions deploy af-trends
supabase functions deploy send-invite-email

echo.
echo Steg 3: Kör database migrations...
supabase db push

echo.
echo ============================================================
echo ✅ Deploy slutford!
echo.
echo 🔧 GLÖM INTE:
echo    1. Sätt miljövariabler i Supabase Dashboard:
echo       - SUPABASE_SERVICE_ROLE_KEY
echo       - OPENAI_API_KEY
echo       - SITE_URL
echo    2. Verifiera att alla functions finns
echo    3. Testa i webbläsaren
echo ============================================================

pause
