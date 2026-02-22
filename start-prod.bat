@echo off
chcp 65001 >nul
echo ============================================
echo   DELTAGARPORTALEN - Pålitlig Start
echo ============================================
echo.

:: Stoppa gamla processer
echo [1/4] Stoppa gamla Node-processer...
taskkill /F /IM node.exe >nul 2>&1
timeout /t 3 /nobreak >nul
echo     OK
echo.

:: Kolla att .env finns
echo [2/4] Kontrollera konfiguration...
if not exist "server\.env" (
    echo     SKAPAR server\.env från mall...
    copy "server\.env.local" "server\.env" >nul
)
if not exist "server\ai\.env" (
    echo     VARNING: server\ai\.env saknas! AI kommer inte fungera.
    echo     Kopiera server\ai\.env.example till server\ai\.env och lägg in din API-nyckel.
)
echo     OK
echo.

:: Installera beroenden om det behövs
echo [3/4] Kontrollera beroenden...
if not exist "server\node_modules" (
    echo     Installerar server-beroenden...
    cd server && call npm install && cd ..
)
if not exist "server\ai\node_modules" (
    echo     Installerar AI-server beroenden...
    cd server\ai && call npm install && cd ..\..
)
if not exist "client\node_modules" (
    echo     Installerar client-beroenden...
    cd client && call npm install && cd ..
)
echo     OK
echo.

:: Starta allt med concurrently
echo [4/4] Startar alla servrar...
echo.
echo ============================================
echo   Grön = Huvudserver (3001)
echo   Gul  = AI-server (3002)  
echo   Blå  = Frontend (5173)
echo ============================================
echo.

npx concurrently --names "SERVER,AI,WEB" --prefix-colors "green,yellow,blue" ^
    "cd server && npm run dev" ^
    "cd server/ai && npm run dev" ^
    "cd client && npm run dev"

echo.
pause
