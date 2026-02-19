@echo off
chcp 65001 >nul
echo ==========================================
echo  Deltagarportalen - GitHub Setup (FIXAD)
echo ==========================================
echo.

cd /d "%~dp0"

echo [1/8] Kontrollerar Git...
git --version >nul 2>&1
if errorlevel 1 (
    echo ERROR: Git är inte installerat!
    echo Ladda ner från: https://git-scm.com/download/win
    pause
    exit /b 1
)

echo.
echo [2/8] Initierar Git-repository...
git init

echo.
echo [3/8] Konfigurerar Git (krävs för commit)...
echo.
echo Ange ditt namn (t.ex. "Mikael"):
set /p GIT_NAME=
echo Ange din e-post:
set /p GIT_EMAIL=
git config user.name "%GIT_NAME%"
git config user.email "%GIT_EMAIL%"

echo.
echo [4/8] Lägger till alla filer...
git add .

echo.
echo [5/8] Kontrollerar om det finns filer att commita...
git diff --cached --quiet
if %errorlevel% == 0 (
    echo INFO: Inga ändringar att commita, fortsätter...
) else (
    echo [6/8] Skapar commit...
    git commit -m "Initial commit - Deltagarportalen"
)

echo.
echo [7/8] Kontrollerar remote...
git remote get-url origin >nul 2>&1
if errorlevel 1 (
    echo Kopplar till GitHub...
    git remote add origin https://github.com/glannstrom-lab/deltagarportalen.git
) else (
    echo Remote finns redan, uppdaterar URL...
    git remote set-url origin https://github.com/glannstrom-lab/deltagarportalen.git
)

echo.
echo [8/8] Pushar till GitHub...
echo.
echo Om du får en inloggningsruta:
echo   - Välj "Sign in with your browser"
echo   - Eller använd Personal Access Token
echo.
git branch -M main
git push -u origin main

if errorlevel 1 (
    echo.
    echo ==========================================
    echo  ! PUSH MISSLYCKADES !
    echo ==========================================
    echo.
    echo Vanliga orsaker och lösningar:
    echo.
    echo 1. REPOSITORY FINNS INTE
    echo    Gå till: https://github.com/new
    echo    Skapa: deltagarportalen (Public)
    echo    Kör skriptet igen
    echo.
    echo 2. INLOGGNING KRÄVS
    echo    Öppna: https://github.com/login
    echo    Logga in, stäng webbläsaren
    echo    Kör skriptet igen
    echo.
    echo 3. TOKEN BEHÖVS
    echo    Om du får "Authentication failed":
    echo    - Gå till: https://github.com/settings/tokens
    echo    - Skapa ny token (kryssa i "repo")
    echo    - Använd token som lösenord
    echo.
    pause
    exit /b 1
)

echo.
echo ==========================================
echo  ✅ KLART! 
echo ==========================================
echo.
echo Dina filer är nu på GitHub!
echo.
echo NÄSTA STEG - Aktivera GitHub Pages:
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
