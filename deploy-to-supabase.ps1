#!/usr/bin/env pwsh
# Deploy script för Deltagarportalen till Supabase
# Kör detta script för att deploya Edge Functions och verifiera konfiguration

param(
    [switch]$SkipFunctions,
    [switch]$SkipMigrations,
    [switch]$Production
)

$ErrorActionPreference = "Stop"

Write-Host "🚀 Deltagarportalen - Supabase Deploy Script" -ForegroundColor Cyan
Write-Host "==============================================" -ForegroundColor Cyan
Write-Host ""

# Kontrollera att Supabase CLI är installerat
Write-Host "📋 Steg 1: Kontrollerar Supabase CLI..." -ForegroundColor Yellow
try {
    $supabaseVersion = supabase --version
    Write-Host "   ✅ Supabase CLI installerad: $supabaseVersion" -ForegroundColor Green
} catch {
    Write-Host "   ❌ Supabase CLI inte hittad. Installera med:" -ForegroundColor Red
    Write-Host "      npm install -g supabase" -ForegroundColor Gray
    exit 1
}

# Kontrollera att användaren är inloggad
Write-Host ""
Write-Host "📋 Steg 2: Kontrollerar inloggning..." -ForegroundColor Yellow
try {
    $user = supabase projects list 2>&1
    if ($user -match "error") {
        throw "Not logged in"
    }
    Write-Host "   ✅ Inloggad på Supabase" -ForegroundColor Green
} catch {
    Write-Host "   ❌ Inte inloggad. Kör:" -ForegroundColor Red
    Write-Host "      supabase login" -ForegroundColor Gray
    exit 1
}

# Hitta projekt
Write-Host ""
Write-Host "📋 Steg 3: Letar efter Supabase-projekt..." -ForegroundColor Yellow
$projectRef = ""
try {
    $config = Get-Content "supabase/config.toml" -Raw
    # Använd double quotes för att undvika PowerShell-escape-problem
    if ($config -match "project_id\s*=\s*""([^""]+)""") {
        $projectRef = $matches[1]
        Write-Host "   ✅ Hittade projekt: $projectRef" -ForegroundColor Green
    } else {
        throw "Could not find project_id"
    }
} catch {
    Write-Host "   ❌ Kunde inte läsa supabase/config.toml" -ForegroundColor Red
    Write-Host "      Fel: $_" -ForegroundColor Gray
    exit 1
}

# Linka projektet om det inte redan är linkat
Write-Host ""
Write-Host "📋 Steg 4: Linkar projekt..." -ForegroundColor Yellow
try {
    $linked = supabase projects list | Select-String $projectRef
    if (-not $linked) {
        Write-Host "   🔗 Linkar projekt..." -ForegroundColor Yellow
        supabase link --project-ref $projectRef
    }
    Write-Host "   ✅ Projekt linkat" -ForegroundColor Green
} catch {
    Write-Host "   ⚠️  Kunde inte verifiera link, fortsätter ändå..." -ForegroundColor Yellow
}

# Deploy Edge Functions
if (-not $SkipFunctions) {
    Write-Host ""
    Write-Host "📋 Steg 5: Deployar Edge Functions..." -ForegroundColor Yellow
    
    $functions = @(
        "ai-cover-letter",
        "cv-analysis", 
        "af-jobsearch",
        "af-taxonomy",
        "af-enrichments",
        "af-jobed",
        "af-trends",
        "send-invite-email"
    )
    
    foreach ($func in $functions) {
        $funcPath = "supabase/functions/$func"
        if (Test-Path $funcPath) {
            Write-Host "   🚀 Deployar $func..." -ForegroundColor Yellow
            try {
                supabase functions deploy $func --project-ref $projectRef
                Write-Host "   ✅ $func deployad" -ForegroundColor Green
            } catch {
                Write-Host "   ⚠️  Kunde inte deploya $func" -ForegroundColor Yellow
            }
        } else {
            Write-Host "   ⏭️  Hoppar över $func (finns ej)" -ForegroundColor Gray
        }
    }
} else {
    Write-Host ""
    Write-Host "📋 Steg 5: Hoppar över Edge Functions (--SkipFunctions)" -ForegroundColor Gray
}

# Kör migrationer
if (-not $SkipMigrations) {
    Write-Host ""
    Write-Host "📋 Steg 6: Kör database migrations..." -ForegroundColor Yellow
    try {
        supabase db push
        Write-Host "   ✅ Migrations körda" -ForegroundColor Green
    } catch {
        Write-Host "   ⚠️  Kunde inte köra migrations automatiskt" -ForegroundColor Yellow
        Write-Host "      Kör manuellt: supabase db push" -ForegroundColor Gray
    }
} else {
    Write-Host ""
    Write-Host "📋 Steg 6: Hoppar över migrations (--SkipMigrations)" -ForegroundColor Gray
}

# Verifiera miljövariabler
Write-Host ""
Write-Host "📋 Steg 7: Verifierar miljövariabler..." -ForegroundColor Yellow
Write-Host "   ⚠️  Kom ihåg att sätta dessa miljövariabler i Supabase Dashboard:" -ForegroundColor Yellow
Write-Host "      - SUPABASE_URL" -ForegroundColor Gray
Write-Host "      - SUPABASE_ANON_KEY" -ForegroundColor Gray
Write-Host "      - SUPABASE_SERVICE_ROLE_KEY" -ForegroundColor Gray
Write-Host ""
Write-Host "   📝 För send-invite-email, sätt även:" -ForegroundColor Yellow
Write-Host "      - SITE_URL (t.ex. https://deltagarportalen.se)" -ForegroundColor Gray

# Summering
Write-Host ""
Write-Host "==============================================" -ForegroundColor Cyan
Write-Host "✅ Deploy script slutfört!" -ForegroundColor Green
Write-Host ""
Write-Host "🔧 MANUELLA STEG som behöver göras:" -ForegroundColor Yellow
Write-Host "   1. Verifiera Edge Functions i Supabase Dashboard" -ForegroundColor White
Write-Host "   2. Sätt miljövariabler för functions" -ForegroundColor White
Write-Host "   3. Testa email-funktionaliteten" -ForegroundColor White
Write-Host "   4. Verifiera RLS policies i Table Editor" -ForegroundColor White
Write-Host ""
Write-Host "📖 Se DEPLOYMENT_CHECKLIST.md för detaljerade instruktioner" -ForegroundColor Cyan
