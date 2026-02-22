@echo off
chcp 65001 >nul
echo ╔══════════════════════════════════════════════════════════════╗
echo ║         Startar AI-servern (OpenRouter)                      ║
echo ╚══════════════════════════════════════════════════════════════╝
echo.

cd server\ai

REM Kontrollera att .env finns
if not exist ".env" (
    echo [ERROR] .env-fil saknas!
    echo.
    echo Skapa filen server\ai\.env med:
    echo OPENROUTER_API_KEY=din-nyckel-har
    echo PORT=3002
    echo.
    pause
    exit /b 1
)

REM Kontrollera att node_modules finns
if not exist "node_modules" (
    echo [INFO] Installerar beroenden...
    call npm install
)

echo [INFO] Startar AI-servern...
echo [INFO] URL: http://localhost:3002
echo [INFO] Health: http://localhost:3002/api/health
echo.

npm run dev
