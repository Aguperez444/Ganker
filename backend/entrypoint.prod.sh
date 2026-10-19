#!/bin/sh
set -e

# Asegurar estructura de directorios en el volumen montado /app/media
mkdir -p /app/media/games /app/media/users/icons /app/media/teams/icons

echo "[*] Aplicando migraciones de Alembic en producción..."
alembic upgrade head

echo "[*] Iniciando servidor FastAPI (Producción)..."
exec "$@"
