@echo off
chcp 65001 >nul
echo ╔══════════════════════════════════════════════════════════════╗
echo ║         Testar databasanslutning                             ║
echo ╚══════════════════════════════════════════════════════════════╝
echo.

cd server

echo [1/3] Kontrollerar Prisma Client...
npx prisma generate >nul 2>&1
if errorlevel 1 (
    echo [ERROR] Kunde inte generera Prisma Client
    pause
    exit /b 1
)
echo [OK] Prisma Client genererad
echo.

echo [2/3] Testar databasanslutning...
node -e "
const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();
async function test() {
    try {
        await prisma.\$connect();
        console.log('[OK] Ansluten till MySQL-databasen');
        
        // Testa att hämta användare (tomt resultat OK)
        const count = await prisma.user.count();
        console.log('[OK] Hittade %d användare i databasen', count);
        
        await prisma.\$disconnect();
        console.log('[OK] Databasanslutning fungerar!');
        process.exit(0);
    } catch (e) {
        console.error('[ERROR]', e.message);
        process.exit(1);
    }
}
test();
"

if errorlevel 1 (
    echo.
    echo [ERROR] Databasanslutning misslyckades
    echo Kontrollera att MySQL är startad i Laragon
    pause
    exit /b 1
)

echo.
echo [3/3] Alla tester OK! ✅
echo.
echo Du kan nu starta applikationen med: start-laragon.bat
pause
