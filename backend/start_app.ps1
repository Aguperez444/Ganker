$ScriptDir = Split-Path -Parent $MyInvocation.MyCommand.Path

$BackendDir = Join-Path $ScriptDir "Backend"


Write-Host "Levantando backend..."
Start-Process powershell -ArgumentList "-NoExit", "-Command", "cd '$BackendDir'; `$env:PYTHONUNBUFFERED='1'; `$env:PYTHONPATH='$BackendDir'; .\.venv\Scripts\python.exe app\infrastructure\start\main.py"

Write-Host ""
Write-Host "Backend iniciado."

