Write-Host "Starting Backend Server on Port 5001..."
$serverProcess = Start-Process powershell -ArgumentList "-NoExit", "-Command", "cd server; npm run dev" -PassThru

Write-Host "Waiting for server to initialize (5 seconds)..."
Start-Sleep -Seconds 5

Write-Host "Building Client and Starting Electron App..."
Write-Host "This might take a moment to build the frontend..."
Start-Process powershell -ArgumentList "-NoExit", "-Command", "npm run electron"
