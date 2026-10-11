#!/bin/sh
set -e

echo "[*] Aplicando migraciones de Alembic..."
alembic upgrade head

echo "[*] Iniciando Uvicorn..."
exec "$@"
