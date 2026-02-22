@echo off
chcp 65001 >nul
echo ╔══════════════════════════════════════════════════════════════╗
echo ║           DELTAGARPORTALEN - Lokal Utveckling                ║
echo ║                     (Laragon)                                ║
echo ╚══════════════════════════════════════════════════════════════╝
echo.

REM Kontrollera att Node.js är installerat
node --version >nul 2>&1
if errorlevel 1 (
    echo [ERROR] Node.js är inte installerat!
    echo Installera Node.js från https://nodejs.org/
    pause
    exit /b 1
)

echo [OK] Node.js är installerat
echo.

REM Kopiera lokal .env om den inte finns
if not exist "server\.env" (
    echo [INFO] Skapar server\.env från .env.local...
    copy "server\.env.local" "server\.env" >nul
)

REM Installera beroenden om de saknas
if not exist "node_modules" (
    echo [INFO] Installerar root-beroenden...
    call npm install
)

if not exist "server\node_modules" (
    echo [INFO] Installerar server-beroenden...
    cd server
    call npm install
    cd ..
)

if not exist "client\node_modules" (
    echo [INFO] Installerar client-beroenden...
    cd client
    call npm install
    cd ..
)

echo.
echo [INFO] Startar Deltagarportalen...
echo [INFO] Frontend: http://localhost:5173
echo [INFO] Backend:  http://localhost:3001
echo [INFO] API Docs: http://localhost:3001/api/health
echo.
echo Tryck Ctrl+C två gånger för att stoppa.
echo.

REM Starta både server och client samtidigt
call npm run dev
