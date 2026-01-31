@echo off
echo Starting Aadaiudai Electron App...
set NODE_ENV=development
cd /d "%~dp0"
node_modules\.bin\electron.cmd .
