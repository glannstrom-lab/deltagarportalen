@echo off
echo Starting Deltagarportalen Test Servers...
echo.

echo Starting Backend Server...
start "Backend Server" cmd /k "cd server && npm start"

echo Starting Frontend Dev Server...
start "Frontend Server" cmd /k "cd client && npm run dev"

echo.
echo Servers starting...
echo Frontend: http://localhost:3000/deltagarportalen/
echo Backend: http://localhost:3001 (or configured port)
echo.
pause
