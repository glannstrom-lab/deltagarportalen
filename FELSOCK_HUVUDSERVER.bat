@echo off
chcp 65001 >nul
cd /d C:\laragon\www\deltagarportal\server
echo Startar huvudserver med felsokning...
echo.
npm run dev 2>&1
echo.
echo === Om det stod fel ovan, kopiera dem och beratta for mig ===
pause
