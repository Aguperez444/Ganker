#!/usr/bin/env bash
# Despliegue automatizado de Ganker en OCI (ARM64): validación, rsync, build nativo y smoke test.
set -Eeuo pipefail
umask 077

# Trabajar siempre desde la raíz del repositorio aunque se invoque desde scripts/
cd -- "$(dirname -- "${BASH_SOURCE[0]}")/.."

PHASE=inicio
ENV_FILE=".env.prod"
COMPOSE_FILE="docker-compose.prod.yml"

# Configuración por defecto de tu VM en OCI (sobreescribible por variables de entorno)
OCI_HOST="${OCI_HOST:-140.238.191.104}"
OCI_USER="${OCI_USER:-opc}"
OCI_SSH_KEY="${OCI_SSH_KEY:-}"
REMOTE_DIR="${REMOTE_DIR:-/home/$OCI_USER/Ganker}"
LANDING_DIR="${LANDING_DIR:-/home/$OCI_USER/ganker-landing}"
PUBLIC_URL="${PUBLIC_URL:-https://gankerweb.app}"

declare -A VALUES=()

# No imprimir el comando fallido: podría contener información sensible.
trap 'printf "\nERROR: falló la fase %s (línea %s).\n" "$PHASE" "$LINENO" >&2' ERR
fail() { printf 'ERROR: %s\n' "$*" >&2; exit 1; }
phase() { PHASE=$1; printf '\n[%s] %s\n' "$1" "$2"; }
compose_local() { docker compose --env-file "$ENV_FILE" -f "$COMPOSE_FILE" "$@"; }

usage() {
  cat <<'HELP'
Uso (Bash >= 4, desde Linux):
  bash scripts/deploy.sh             Validar, sincronizar a OCI, compilar ARM64, levantar y probar.
  bash scripts/deploy.sh --check     Solo validar entorno local, .env.prod y sintaxis de Compose.
  bash scripts/deploy.sh --restart   Reiniciar contenedores en OCI sin volver a compilar imágenes.
  bash scripts/deploy.sh --test      Solo ejecutar scripts/probar-stack.sh contra producción.

Variables de entorno opcionales para personalizar la conexión SSH:
  OCI_USER     Usuario SSH de la VM en OCI (por defecto: opc)
  OCI_HOST     IP o dominio del servidor (por defecto: 140.238.191.104)
  OCI_SSH_KEY  Ruta a la clave privada SSH (ej: ~/.ssh/id_ed25519)
  REMOTE_DIR   Carpeta destino en OCI (por defecto: /home/$OCI_USER/Ganker)
HELP
}

# Leer .env.prod de forma segura sin ejecutar source/eval.
read_env() {
  local file=$1 line key value line_number=0
  [[ -f "$file" && -r "$file" ]] || fail "Falta $file. Ejecutá primero: bash scripts/preparar-env-prod.sh"
  while IFS= read -r line || [[ -n "$line" ]]; do
    line_number=$((line_number + 1))
    line=${line%$'\r'}
    [[ "$line" =~ ^[[:space:]]*(#|$) ]] && continue
    [[ "$line" =~ ^([A-Za-z_][A-Za-z0-9_]*)=(.*)$ ]] || fail "$file:$line_number: formato inválido, se espera CLAVE=valor."
    key=${BASH_REMATCH[1]}
    value=${BASH_REMATCH[2]}
    # Quitar comillas envolventes simples o dobles si las hubiera
    value=${value#\"}; value=${value%\"}
    value=${value#\'}; value=${value%\'}

    VALUES["$key"]=$value
  done < "$file"
}

require_key() {
  local key=$1
  local val="${VALUES[$key]:-}"
  [[ -n "$val" ]] || fail "La variable obligatoria $key está vacía o falta en $ENV_FILE."
  case "$val" in
    CHANGE_ME*|*reemplazar*|*tu_clave*|*example*)
      fail "$ENV_FILE: debes completar un valor real para $key."
      ;;
  esac
}

validate_local_environment() {
  local cmd
  for cmd in docker ssh rsync curl; do
    command -v "$cmd" >/dev/null || fail "Falta el comando '$cmd' en tu sistema."
  done

  docker compose version >/dev/null 2>&1 || fail "Falta el plugin 'docker compose'."

  [[ -f "$COMPOSE_FILE" ]] || fail "Falta $COMPOSE_FILE en la raíz del proyecto."
  [[ -f "backend/Dockerfile.prod" ]] || fail "Falta backend/Dockerfile.prod."
  [[ -f "backend/entrypoint.prod.sh" ]] || fail "Falta backend/entrypoint.prod.sh."
  [[ -f "nginx/Dockerfile.prod" ]] || fail "Falta nginx/Dockerfile.prod."
  [[ -f "nginx/prod.conf" ]] || fail "Falta nginx/prod.conf."
  [[ -f "scripts/probar-stack.sh" ]] || fail "Falta scripts/probar-stack.sh."

  read_env "$ENV_FILE"

  # Validar variables críticas para PostgreSQL, JWT y el seed del usuario Owner
  for key in POSTGRES_USER POSTGRES_PASSWORD POSTGRES_DB JWT_SECRET_KEY \
             INITIAL_OWNER_USERNAME INITIAL_OWNER_EMAIL INITIAL_OWNER_PASSWORD; do
    require_key "$key"
  done

  [[ "${VALUES[POSTGRES_USER]}" != "postgres" ]] || printf 'AVISO: Estás usando "postgres" como POSTGRES_USER.\n'

  # Validar sintaxis e interpolación del docker-compose.prod.yml
  compose_local config --quiet
  printf 'OK: Entorno local, %s y %s validados correctamente.\n' "$ENV_FILE" "$COMPOSE_FILE"
}

setup_ssh() {
  SSH_TARGET="${OCI_USER}@${OCI_HOST}"
  SSH_OPTS=(-o BatchMode=yes -o ConnectTimeout=10 -o StrictHostKeyChecking=accept-new)
  if [[ -n "$OCI_SSH_KEY" ]]; then
    [[ -f "$OCI_SSH_KEY" ]] || fail "No existe la clave SSH especificada en OCI_SSH_KEY: $OCI_SSH_KEY"
    SSH_OPTS+=(-i "$OCI_SSH_KEY" -o IdentitiesOnly=yes)
  fi
}

ssh_remote() {
  ssh "${SSH_OPTS[@]}" "$SSH_TARGET" "$@"
}

wait_for_ssh() {
  local attempt
  for ((attempt=1; attempt<=15; attempt++)); do
    if ssh_remote true 2>/dev/null; then
      printf 'OK: Conexión SSH establecida con %s\n' "$SSH_TARGET"
      return 0
    fi
    sleep 3
  done
  fail "No se pudo conectar por SSH a $SSH_TARGET. Verificá OCI_USER, OCI_SSH_KEY y que el puerto 22 esté abierto."
}

sync_project_to_oci() {
  ssh_remote "umask 077; mkdir -p '$REMOTE_DIR/nginx/certs' '$REMOTE_DIR/backups' '$REMOTE_DIR/scripts'; chmod 700 '$REMOTE_DIR'"

  # 1. Sincronizar SOLO lo necesario para producción y proteger datos persistentes del servidor
  rsync -az --delete --delete-excluded \
    -e "ssh ${SSH_OPTS[*]}" \
    --filter='P /backups/***' \
    --filter='P /nginx/certs/***' \
    --filter='P /.env.prod' \
    --filter='P /.env' \
    --include='/docker-compose.prod.yml' \
    --include='/scripts/' \
    --include='/scripts/backup_prod.sh' \
    --exclude='/scripts/***' \
    --include='/nginx/' \
    --include='/nginx/Dockerfile.prod' \
    --include='/nginx/prod.conf' \
    --exclude='/nginx/***' \
    --include='/backend/***' \
    --include='/Frontend/***' \
    --exclude='*.md' \
    --exclude='opencode.jsonc' \
    --exclude='.mcp*' \
    --exclude='.cursor*' \
    --exclude='.claude*' \
    --exclude='.agent*' \
    --exclude='.env*' \
    --exclude='secrets.env' \
    --exclude='Dockerfile' \
    --exclude='entrypoint.sh' \
    --exclude='node_modules/' \
    --exclude='dist/' \
    --exclude='__pycache__/' \
    --exclude='.pytest_cache/' \
    --exclude='.venv/' \
    --exclude='venv/' \
    --exclude='tests/' \
    --exclude='test/' \
    --exclude='*.test.*' \
    --exclude='*.spec.*' \
    --exclude='/backend/media/' \
    --exclude='*' \
    ./ "$SSH_TARGET:$REMOTE_DIR/"

  # 2. Copiar .env.prod por separado asegurando permisos 600 y enlace simbólico .env
  scp "${SSH_OPTS[@]}" "$ENV_FILE" "$SSH_TARGET:$REMOTE_DIR/.env.prod"
  ssh_remote "chmod 600 '$REMOTE_DIR/.env.prod' && chmod +x '$REMOTE_DIR/scripts/backup_prod.sh' && ln -sf .env.prod '$REMOTE_DIR/.env'"
  printf 'OK: Solo archivos de producción sincronizados en %s:%s\n' "$SSH_TARGET" "$REMOTE_DIR"
}

deploy_remote_stack() {
  local mode=$1
  ssh_remote "bash -se -- '$REMOTE_DIR' '$LANDING_DIR' '$mode'" <<'REMOTE'
set -euo pipefail
REMOTE_DIR=$1
LANDING_DIR=$2
MODE=$3

cd "$REMOTE_DIR"

# Determinar si docker requiere sudo para el usuario actual
DOCKER_CMD=(docker)
if ! docker info >/dev/null 2>&1; then
  DOCKER_CMD=(sudo docker)
fi

# 1. Verificar certificados SSL de Cloudflare Origin (o copiarlos de ganker-landing si están ahí)
if [[ ! -s nginx/certs/fullchain.pem || ! -s nginx/certs/privkey.pem ]]; then
  echo "[*] Buscando certificados existentes en $LANDING_DIR..."
  cert_found=$(find "$LANDING_DIR" -maxdepth 3 -name "cert.pem" -o -name "fullchain.pem" 2>/dev/null | head -n 1 || true)
  key_found=$(find "$LANDING_DIR" -maxdepth 3 -name "key.pem" -o -name "privkey.pem" 2>/dev/null | head -n 1 || true)

  if [[ -n "$cert_found" && -n "$key_found" ]]; then
    cp "$cert_found" nginx/certs/fullchain.pem
    cp "$key_found" nginx/certs/privkey.pem
    chmod 600 nginx/certs/fullchain.pem nginx/certs/privkey.pem
    echo "[OK] Certificados copiados automáticamente desde $LANDING_DIR"
  else
    echo "ERROR: Faltan nginx/certs/fullchain.pem y nginx/certs/privkey.pem en el servidor." >&2
    exit 1
  fi
fi
chmod 600 nginx/certs/fullchain.pem nginx/certs/privkey.pem

# 2. Validar sintaxis de Compose en el servidor
"${DOCKER_CMD[@]}" compose --env-file .env.prod -f docker-compose.prod.yml config --quiet

# 3. Compilar imágenes ARM64 ANTES de apagar la landing (minimiza el downtime a ~2 segundos)
if [[ "$MODE" != "--restart" ]]; then
  echo "[*] Compilando imágenes nativas ARM64 (Frontend Vite + Backend FastAPI)..."
  "${DOCKER_CMD[@]}" compose --env-file .env.prod -f docker-compose.prod.yml build --pull
fi

# 4. Si la landing temporal sigue corriendo y ocupando los puertos 80/443, bajarla
if [[ -d "$LANDING_DIR" && -f "$LANDING_DIR/docker-compose.yml" ]]; then
  if "${DOCKER_CMD[@]}" compose -f "$LANDING_DIR/docker-compose.yml" ps --services --filter "status=running" | grep -q .; then
    echo "[*] Deteniendo landing page temporal en $LANDING_DIR para liberar puertos 80 y 443..."
    "${DOCKER_CMD[@]}" compose -f "$LANDING_DIR/docker-compose.yml" down
  fi
fi

# 5. Levantar el stack de producción de Ganker y esperar healthchecks
echo "[*] Levantando contenedores de Ganker en producción..."
if ! "${DOCKER_CMD[@]}" compose --env-file .env.prod -f docker-compose.prod.yml up -d --remove-orphans --wait --wait-timeout 180; then
  "${DOCKER_CMD[@]}" compose --env-file .env.prod -f docker-compose.prod.yml ps -a
  "${DOCKER_CMD[@]}" compose --env-file .env.prod -f docker-compose.prod.yml logs --tail=50
  exit 1
fi

# 6. Limpiar imágenes huérfanas (dangling) de builds anteriores para cuidar el disco de OCI
"${DOCKER_CMD[@]}" image prune -f >/dev/null 2>&1 || true

"${DOCKER_CMD[@]}" compose --env-file .env.prod -f docker-compose.prod.yml ps
REMOTE
}

main() {
  local mode=${1:-}
  case "$mode" in
    -h|--help) usage; return 0 ;;
    --test)
      phase TEST "Ejecutando pruebas contra $PUBLIC_URL"
      bash scripts/probar-stack.sh "$PUBLIC_URL"
      return 0
      ;;
    --check|--restart|'')
      [[ $# -le 1 ]] || fail "Demasiados argumentos. Usá --help para ver las opciones."
      ;;
    *)
      usage >&2
      exit 1
      ;;
  esac

  phase 1 "Validando entorno local, $ENV_FILE y $COMPOSE_FILE"
  validate_local_environment
  [[ "$mode" != "--check" ]] || return 0

  phase 2 "Verificando acceso SSH a OCI ($OCI_USER@$OCI_HOST)"
  setup_ssh
  wait_for_ssh

  phase 3 "Sincronizando repositorio y configuración hacia $REMOTE_DIR"
  sync_project_to_oci

  phase 4 "Compilando y desplegando stack en OCI (ARM64)"
  deploy_remote_stack "$mode"

  phase 5 "Ejecutando Smoke Test contra $PUBLIC_URL"
  bash scripts/probar-stack.sh "$PUBLIC_URL"

  printf '\n=================================================================\n'
  printf ' DESPLIEGUE DE GANKER COMPLETADO EXITOSAMENTE: %s\n' "$PUBLIC_URL"
  printf '=================================================================\n'
}

main "$@"
