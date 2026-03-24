$env:ELECTRON_RUN_AS_NODE = $null
[System.Environment]::SetEnvironmentVariable("ELECTRON_RUN_AS_NODE", $null, "Process")
Remove-Item Env:\ELECTRON_RUN_AS_NODE -ErrorAction SilentlyContinue

Write-Host "Cleared ELECTRON_RUN_AS_NODE. Starting Electron..." -ForegroundColor Green
npm run electron
