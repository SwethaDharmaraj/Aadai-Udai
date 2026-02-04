$ErrorActionPreference = "Continue"
Write-Host "Starting Electron build and launch..."
npm run electron | Out-File -FilePath electron_debug.log -Encoding utf8
