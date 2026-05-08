# Kartaloka — jalankan API + website sekaligus
# Usage: .\start-dev.ps1

$root = Split-Path -Parent $MyInvocation.MyCommand.Path

Write-Host ""
Write-Host "=== Kartaloka Dev Server ===" -ForegroundColor Cyan
Write-Host "API  -> http://localhost:8001" -ForegroundColor Green
Write-Host "Web  -> http://localhost:3000" -ForegroundColor Green
Write-Host ""
Write-Host "Tekan Ctrl+C untuk stop semua." -ForegroundColor Yellow
Write-Host ""

# Jalankan FastAPI di background
$api = Start-Process powershell -ArgumentList `
    "-NoExit", "-Command", `
    "cd '$root'; Write-Host '[API] starting...' -ForegroundColor Green; uvicorn ml.api.server:app --host 0.0.0.0 --port 8001" `
    -PassThru

# Jalankan Next.js di background
$web = Start-Process powershell -ArgumentList `
    "-NoExit", "-Command", `
    "cd '$root\kartaloka-web'; Write-Host '[WEB] starting...' -ForegroundColor Green; npm run dev" `
    -PassThru

Write-Host "API PID: $($api.Id)  |  Web PID: $($web.Id)" -ForegroundColor DarkGray
Write-Host ""
Write-Host "Buka browser: http://localhost:3000" -ForegroundColor Cyan

# Tunggu user tekan enter untuk stop
Read-Host "Tekan Enter untuk stop semua server"

Stop-Process -Id $api.Id -Force -ErrorAction SilentlyContinue
Stop-Process -Id $web.Id -Force -ErrorAction SilentlyContinue
Write-Host "Semua server dihentikan." -ForegroundColor Yellow
