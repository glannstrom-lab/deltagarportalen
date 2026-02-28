@echo off
chcp 65001 >nul
echo ==========================================
echo  Deploy Supabase Edge Functions
echo ==========================================
echo.

REM Kontrollera att Supabase CLI är installerad
where supabase >nul 2>nul
if %errorlevel% neq 0 (
    echo [FEL] Supabase CLI är inte installerad!
    echo Installera med: npm install -g supabase
    pause
    exit /b 1
)

echo [1/5] Deploy af-jobsearch...
supabase functions deploy af-jobsearch
if %errorlevel% neq 0 (
    echo [FEL] Kunde inte deploy af-jobsearch
    pause
    exit /b 1
)

echo [2/5] Deploy af-taxonomy...
supabase functions deploy af-taxonomy

echo [3/5] Deploy af-jobed...
supabase functions deploy af-jobed

echo [4/5] Deploy af-enrichments...
supabase functions deploy af-enrichments

echo [5/5] Deploy af-trends...
supabase functions deploy af-trends

echo.
echo ==========================================
echo  Deploy klart!
echo ==========================================
echo.
echo Testa funktionerna med:
echo curl "https://odcvrdkvzyrbdzvdrhkz.supabase.co/functions/v1/af-jobsearch/search?limit=3"
echo.
pause
