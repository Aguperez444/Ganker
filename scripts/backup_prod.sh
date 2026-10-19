#!/usr/bin/env bash
# ==============================================================================
# Script de Backup Automatizado para Producción (PostgreSQL + Archivos Media)
# Uso manual: ./scripts/backup_prod.sh
# Uso en cron (todos los días a las 04:00 AM):
#   0 4 * * * /ruta/a/Ganker/scripts/backup_prod.sh >> /var/log/ganker_backup.log 2>&1
# ==============================================================================
set -euo pipefail

PROJECT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")/.." && pwd)"
ENV_FILE="$PROJECT_DIR/.env.prod"
BACKUP_DIR="$PROJECT_DIR/backups"
RETENTION_DAYS=7
TIMESTAMP="$(date +"%Y%m%d_%H%M%S")"

if [ ! -f "$ENV_FILE" ]; then
    echo "[ERROR] No se encontró el archivo $ENV_FILE" >&2
    exit 1
fi

# Cargar variables de Postgres desde .env.prod
set -a
# shellcheck disable=SC1090
source "$ENV_FILE"
set +a

mkdir -p "$BACKUP_DIR/db" "$BACKUP_DIR/media"
chmod 700 "$BACKUP_DIR"

echo "[*] Iniciando backup de PostgreSQL ($TIMESTAMP)..."
docker exec ganker_postgres_prod pg_dump -U "$POSTGRES_USER" -d "$POSTGRES_DB" --clean --if-exists | gzip > "$BACKUP_DIR/db/db_${TIMESTAMP}.sql.gz"

echo "[*] Iniciando backup del volumen de medios (uploads_prod_data)..."
docker run --rm \
    -v ganker_uploads_prod_data:/media_src:ro \
    -v "$BACKUP_DIR/media":/backup_dst \
    alpine:3.20 \
    tar -czf "/backup_dst/media_${TIMESTAMP}.tar.gz" -C /media_src .

echo "[*] Eliminando backups con más de ${RETENTION_DAYS} días de antigüedad..."
find "$BACKUP_DIR/db" -type f -name "db_*.sql.gz" -mtime +"$RETENTION_DAYS" -delete
find "$BACKUP_DIR/media" -type f -name "media_*.tar.gz" -mtime +"$RETENTION_DAYS" -delete

echo "[OK] Backup completado exitosamente en $BACKUP_DIR"
