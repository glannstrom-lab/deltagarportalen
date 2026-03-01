#!/usr/bin/env pwsh
# Test-script för att verifiera Supabase-deploy
# Kör detta efter att ha deployat för att testa att allt fungerar

param(
    [string]$ProjectRef = "odcvrdkvzyrbdzvdrhkz",
    [string]$SiteUrl = "https://deltagarportalen.se"
)

$ErrorActionPreference = "Continue"

Write-Host "==============================================" -ForegroundColor Cyan
Write-Host "  Testar Deltagarportalen - Supabase Deploy" -ForegroundColor Cyan
Write-Host "==============================================" -ForegroundColor Cyan
Write-Host ""

$TestsPassed = 0
$TestsFailed = 0

function Test-Connection {
    param($Name, $Url)
    Write-Host "Testing $Name..." -NoNewline
    try {
        $response = Invoke-WebRequest -Uri $Url -Method HEAD -TimeoutSec 10 -ErrorAction Stop
        Write-Host " ✅ OK" -ForegroundColor Green
        return $true
    } catch {
        Write-Host " ❌ FAILED" -ForegroundColor Red
        Write-Host "   Error: $($_.Exception.Message)" -ForegroundColor Gray
        return $false
    }
}

function Test-SupabaseTable {
    param($TableName, $ProjectRef)
    Write-Host "Checking table: $TableName..." -NoNewline
    # Vi kan inte direkt testa detta utan auth, men vi kan visa instruktioner
    Write-Host " ⚠️  MANUAL CHECK REQUIRED" -ForegroundColor Yellow
    Write-Host "   Go to: https://supabase.com/dashboard/project/$ProjectRef/database/tables" -ForegroundColor Gray
}

# Test 1: Supabase Dashboard
Write-Host "Test 1: Supabase Dashboard Access" -ForegroundColor Yellow
$dashboardUrl = "https://supabase.com/dashboard/project/$ProjectRef"
if (Test-Connection "Supabase Dashboard" $dashboardUrl) {
    $TestsPassed++
} else {
    $TestsFailed++
}
Write-Host ""

# Test 2: Edge Functions
Write-Host "Test 2: Edge Functions" -ForegroundColor Yellow
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
    $funcUrl = "https://$ProjectRef.supabase.co/functions/v1/$func"
    # Vi förväntar oss 401 (Unauthorized) utan token, vilket betyder att function finns
    try {
        $response = Invoke-WebRequest -Uri $funcUrl -Method POST -TimeoutSec 5
        Write-Host "  $func... ⚠️  Unexpected response" -ForegroundColor Yellow
    } catch {
        if ($_.Exception.Response.StatusCode -eq 401 -or $_.Exception.Response.StatusCode -eq 400) {
            Write-Host "  $func... ✅ Found (requires auth)" -ForegroundColor Green
            $TestsPassed++
        } else {
            Write-Host "  $func... ❌ Error: $($_.Exception.Response.StatusCode)" -ForegroundColor Red
            $TestsFailed++
        }
    }
}
Write-Host ""

# Test 3: Database Tables
Write-Host "Test 3: Database Tables (Manual Check)" -ForegroundColor Yellow
$tables = @(
    "profiles",
    "cvs",
    "cv_versions",
    "cover_letters",
    "interest_results",
    "saved_jobs",
    "articles",
    "consultant_notes",
    "invitations"
)

Write-Host "  Please verify these tables exist:" -ForegroundColor Yellow
foreach ($table in $tables) {
    Write-Host "    - $table" -ForegroundColor Gray
}
Write-Host "  Check at: https://supabase.com/dashboard/project/$ProjectRef/database/tables" -ForegroundColor Cyan
Write-Host ""

# Test 4: Environment Variables
Write-Host "Test 4: Environment Variables (Manual Check)" -ForegroundColor Yellow
Write-Host "  Please verify these are set in Dashboard > Settings > Edge Functions:" -ForegroundColor Yellow
Write-Host "    ✅ SUPABASE_URL" -ForegroundColor Gray
Write-Host "    ✅ SUPABASE_SERVICE_ROLE_KEY" -ForegroundColor Gray
Write-Host "    ✅ OPENAI_API_KEY" -ForegroundColor Gray
Write-Host "    ✅ SITE_URL" -ForegroundColor Gray
Write-Host ""

# Test 5: Frontend URL
if ($SiteUrl -ne "https://deltagarportalen.se") {
    Write-Host "Test 5: Frontend URL" -ForegroundColor Yellow
    if (Test-Connection "Frontend" $SiteUrl) {
        $TestsPassed++
    } else {
        $TestsFailed++
    }
    Write-Host ""
}

# Summary
Write-Host "==============================================" -ForegroundColor Cyan
Write-Host "  Test Summary" -ForegroundColor Cyan
Write-Host "==============================================" -ForegroundColor Cyan
Write-Host "Tests Passed: $TestsPassed" -ForegroundColor Green
Write-Host "Tests Failed: $TestsFailed" -ForegroundColor $(if ($TestsFailed -gt 0) { "Red" } else { "Green" })
Write-Host ""

if ($TestsFailed -eq 0) {
    Write-Host "🎉 All automated tests passed!" -ForegroundColor Green
} else {
    Write-Host "⚠️  Some tests failed. Check the errors above." -ForegroundColor Yellow
}

Write-Host ""
Write-Host "🔧 MANUAL TESTS REQUIRED:" -ForegroundColor Yellow
Write-Host "  1. Open your site: $SiteUrl" -ForegroundColor White
Write-Host "  2. Register a new account" -ForegroundColor White
Write-Host "  3. Login" -ForegroundColor White
Write-Host "  4. Create a CV" -ForegroundColor White
Write-Host "  5. Download PDF (in large widget view)" -ForegroundColor White
Write-Host "  6. Test consultant invite flow" -ForegroundColor White
Write-Host ""
Write-Host "📖 See TEST_AFTER_DEPLOY.md for detailed test instructions" -ForegroundColor Cyan
Write-Host ""

Pause
