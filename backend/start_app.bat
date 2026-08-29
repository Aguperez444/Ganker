@echo off
setlocal

set SCRIPT_DIR=%~dp0
set BACKEND_DIR=%SCRIPT_DIR%Backend

echo Levantando backend...
start "Backend" cmd /k "cd /d "%BACKEND_DIR%" && set PYTHONUNBUFFERED=1 && set PYTHONPATH=%BACKEND_DIR% && .venv\Scripts\python.exe app\infrastructure\start\main.py"


echo.
echo Backend levantado.
echo Para apagarlo, cerrar las ventanas o usar CTRL+C.
echo.

endlocal
