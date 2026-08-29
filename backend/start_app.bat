@echo off
setlocal

set "SCRIPT_DIR=%~dp0"
set "BACKEND_DIR=%SCRIPT_DIR%"

if not exist "%BACKEND_DIR%" (
    echo [ERROR] No existe el directorio: "%BACKEND_DIR%"
    pause
    exit /b 1
)

if not exist "%BACKEND_DIR%\.venv\Scripts\python.exe" (
    echo [ERROR] No se encuentra el ejecutable de Python en: "%BACKEND_DIR%\.venv\Scripts\python.exe"
    pause
    exit /b 1
)

if not exist "%BACKEND_DIR%\app\infrastructure\start\main.py" (
    echo [ERROR] No se encuentra el archivo: "%BACKEND_DIR%\app\infrastructure\start\main.py"
    pause
    exit /b 1
)

echo Levantando backend...
start "Backend" /D "%BACKEND_DIR%" cmd /k "set PYTHONUNBUFFERED=1 && set PYTHONPATH=%BACKEND_DIR% && .venv\Scripts\python.exe app\infrastructure\start\main.py"

echo.
echo Backend levantado correctamente.
echo.

endlocal