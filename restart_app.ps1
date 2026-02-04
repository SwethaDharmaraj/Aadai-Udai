# Kill existing Node.js processes to clear ports
Write-Host "Stopping existing Node.js processes..."
taskkill /F /IM node.exe /T 2>$null

# Start Backend Server
Write-Host "Starting Backend Server on Port 5001..."
$serverProcess = Start-Process powershell -ArgumentList "-NoExit", "-Command", "cd server; npm run dev" -PassThru

Write-Host "Waiting for server to initialize (5 seconds)..."
Start-Sleep -Seconds 5

# Start Electron App (incorporating the fix)
$env:ELECTRON_RUN_AS_NODE = ""
Remove-Item Env:\ELECTRON_RUN_AS_NODE -ErrorAction SilentlyContinue

Write-Host "Building and Starting Electron Application..."
Start-Process powershell -ArgumentList "-NoExit", "-Command", "npm run electron"
