# Start both frontend and backend servers

# Kill any existing node processes on the ports
Get-Process node -ErrorAction SilentlyContinue | Stop-Process -Force

# Start Backend Server
$backendJob = Start-Job -ScriptBlock {
    Set-Location "$using:PWD\server"
    Write-Host "Starting Backend Server..." -ForegroundColor Green
    npm start
}

# Wait a moment for backend to start
Start-Sleep 3

# Start Frontend Server  
$frontendJob = Start-Job -ScriptBlock {
    Set-Location "$using:PWD\client"
    Write-Host "Starting Frontend Server..." -ForegroundColor Cyan
    npm run dev
}

# Show output from both jobs
Write-Host "`n=== Servers Starting ===" -ForegroundColor Yellow
Write-Host "Backend: http://localhost:3001" -ForegroundColor Green
Write-Host "Frontend: http://localhost:3000/deltagarportalen/" -ForegroundColor Cyan
Write-Host "`nPress Ctrl+C to stop both servers`n" -ForegroundColor Yellow

while ($true) {
    Receive-Job $backendJob -ErrorAction SilentlyContinue
    Receive-Job $frontendJob -ErrorAction SilentlyContinue
    Start-Sleep 1
}
