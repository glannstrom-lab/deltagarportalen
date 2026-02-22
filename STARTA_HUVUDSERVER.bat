@echo off
chcp 65001 >nul
echo Startar HUVUDSERVER...
cd /d C:\laragon\www\deltagarportal\server
npm run dev
pause
