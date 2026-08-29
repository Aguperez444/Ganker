$ScriptDir = Split-Path -Parent $MyInvocation.MyCommand.Path

$BackendDir = Join-Path $ScriptDir "Backend"
$FrontendDir = Join-Path $ScriptDir "Frontend"

Write-Host "Levantando backend..."
Start-Process powershell -ArgumentList "-NoExit", "-Command", "cd '$BackendDir'; `$env:PYTHONUNBUFFERED='1'; `$env:PYTHONPATH='$BackendDir'; .\.venv\Scripts\python.exe app\infrastructure\start\main.py"

Write-Host "Levantando frontend..."
Start-Process powershell -ArgumentList "-NoExit", "-Command", "cd '$FrontendDir'; npm run dev"

Write-Host ""
Write-Host "Backend y frontend iniciados en ventanas separadas."

