@echo off
chcp 65001 >nul
echo ╔══════════════════════════════════════════════════════════════╗
echo ║         Startar Deltagarportalen + AI-server                 ║
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

if not exist "server\ai\node_modules" (
    echo [INFO] Installerar AI-server beroenden...
    cd server\ai
    call npm install
    cd ..\..
)

echo.
echo ════════════════════════════════════════════════════════════════
echo   Startar båda servrarna...
echo ════════════════════════════════════════════════════════════════
echo.
echo   Huvudserver:  http://localhost:3001
echo   AI-server:    http://localhost:3002
echo   Frontend:     http://localhost:5173 (eller 3000)
echo.
echo   Tryck Ctrl+C tva ganger for att stoppa.
echo.

start "Huvudserver" cmd /k "cd server && npm run dev"
timeout /t 2 >nul
start "AI-server" cmd /k "cd server\ai && npm run dev"
timeout /t 2 >nul
start "Frontend" cmd /k "npm run dev:client"

echo Servrar startas i separata fonster...
echo.
pause
