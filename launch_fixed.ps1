$env:ELECTRON_RUN_AS_NODE = ""
Remove-Item Env:\ELECTRON_RUN_AS_NODE -ErrorAction SilentlyContinue

Write-Host "Cleared ELECTRON_RUN_AS_NODE environment variable."
Write-Host "Starting Electron Application..."

npm run electron
