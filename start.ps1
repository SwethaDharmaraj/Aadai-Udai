# AADAIUDAI - Start Script
# Run this to start both server and client

$port = 5000

# Find and kill process using the port
$connections = netstat -ano | Select-String ":$port\s+.*LISTENING"
if ($connections) {
    $connections | ForEach-Object {
        $parts = $_ -split '\s+'
        $processId = $parts[-1]
        if ($processId -match '^\d+$') {
            Write-Host "Stopping process on port $port (PID: $processId)..."
            taskkill /PID $processId /F 2>$null
            Start-Sleep -Seconds 1
        }
    }
}

Write-Host "Starting backend on port $port..."
Start-Process powershell -ArgumentList "-NoExit", "-Command", "cd '$PSScriptRoot\server'; node index.js"

Start-Sleep -Seconds 2

Write-Host "Starting frontend..."
Start-Process powershell -ArgumentList "-NoExit", "-Command", "cd '$PSScriptRoot\client'; npm run dev"

Write-Host "`nApp should open at http://localhost:5173"
Write-Host "Backend API: http://localhost:$port"
