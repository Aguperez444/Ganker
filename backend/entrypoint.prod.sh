#!/bin/sh
set -e

# Asegurar estructura de directorios en el volumen montado /app/media
mkdir -p /app/media/games /app/media/users/icons /app/media/teams/icons

# Si el contenedor inicia como root, garantizar que el volumen /app/media pertenezca a appuser (10001:10001)
# y luego reducir privilegios con gosu para correr Alembic y Uvicorn como appuser.
if [ "$(id -u)" = "0" ]; then
    chown -R appuser:appgroup /app/media
    echo "[*] Aplicando migraciones de Alembic en producción (como appuser)..."
    gosu appuser alembic upgrade head
    echo "[*] Iniciando servidor FastAPI en producción (como appuser)..."
    exec gosu appuser "$@"
else
    echo "[*] Aplicando migraciones de Alembic en producción..."
    alembic upgrade head
    echo "[*] Iniciando servidor FastAPI en producción..."
    exec "$@"
fi
