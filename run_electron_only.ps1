$ErrorActionPreference = "Continue"
Write-Host "Re-running Electron..."
.\node_modules\.bin\electron.cmd . | Out-File -FilePath electron_run.log -Encoding utf8
