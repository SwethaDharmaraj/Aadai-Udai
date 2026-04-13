# This script tests the internal Docker network communication for the Aadai Udai application
Write-Host "Starting Aadai Udai Docker containers..." -ForegroundColor Cyan
docker-compose up -d

Write-Host "`nWaiting 5 seconds for containers to initialize..." -ForegroundColor Yellow
Start-Sleep -Seconds 5

Write-Host "`n--- Testing Communication: Backend to Database ---" -ForegroundColor Cyan
# Execute a ping from backend container to db container (sending 3 packets)
docker exec aadaiudai_backend ping -c 3 db

if ($LASTEXITCODE -eq 0) {
    Write-Host "Success! Backend can communicate with DB over the internal network." -ForegroundColor Green
} else {
    Write-Host "Failed! Backend cannot reach DB." -ForegroundColor Red
}

Write-Host "`n--- Testing Communication: Frontend to Backend ---" -ForegroundColor Cyan
# Execute a ping from frontend container to backend container
docker exec aadaiudai_frontend ping -c 3 backend

if ($LASTEXITCODE -eq 0) {
    Write-Host "Success! Frontend can communicate with Backend over the internal network." -ForegroundColor Green
} else {
    Write-Host "Failed! Frontend cannot reach Backend." -ForegroundColor Red
}

Write-Host "`nNetwork test complete!" -ForegroundColor Cyan
