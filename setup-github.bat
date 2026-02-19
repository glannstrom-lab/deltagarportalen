@echo off
chcp 65001 >nul
echo ==========================================
echo  Deltagarportalen - GitHub Setup
echo ==========================================
echo.

cd /d "%~dp0"

echo [1/6] Initierar Git-repository...
git init
if errorlevel 1 (
    echo ERROR: Kunde inte initiera Git. Är Git installerat?
    pause
    exit /b 1
)

echo.
echo [2/6] Lägger till alla filer...
git add .

echo.
echo [3/6] Skapar commit...
git commit -m "Initial commit - Deltagarportalen med GitHub Pages"

echo.
echo [4/6] Kopplar till GitHub-repository...
git remote add origin https://github.com/glannstrom-lab/deltagarportalen.git
if errorlevel 1 (
    echo NOTE: Remote kanske redan finns, fortsätter...
)

echo.
echo [5/6] Pushar till GitHub...
git push -u origin main
if errorlevel 1 (
    echo.
    echo ==========================================
    echo  ! PUSH MISSLYCKADES !
    echo ==========================================
    echo.
    echo Detta kan bero på:
    echo  1. Repositoryt finns inte på GitHub än
    echo  2. Du behöver logga in på GitHub
    echo  3. Repositoryt heter något annat
    echo.
    echo Lösning:
    echo  1. Gå till https://github.com/new
    echo  2. Skapa repository "deltagarportalen"
    echo  3. Kör detta skript igen
    echo.
    pause
    exit /b 1
)

echo.
echo [6/6] KLART! ✅
echo.
echo ==========================================
echo  Nästa steg:
echo ==========================================
echo.
echo 1. Gå till:
echo    https://github.com/glannstrom-lab/deltagarportalen/settings/pages
echo.
echo 2. Under "Build and deployment"
echo    Välj: GitHub Actions
echo.
echo 3. Klicka Save
echo.
echo 4. Vänta 2-3 minuter
echo.
echo 5. Besök din sida:
echo    https://glannstrom-lab.github.io/deltagarportalen/
echo.
echo ==========================================
pause
