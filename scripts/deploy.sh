#!/usr/bin/env bash
# =============================================================================
# GANKER - DESPLIEGUE DE PRODUCCIÓN EN ORACLE CLOUD (OCI / ARM64)
# =============================================================================
# Objetivo:
#   Sincronizar únicamente los archivos necesarios para producción, construir
#   imágenes Docker directamente en la VM ARM64, actualizar los contenedores
#   y comprobar que la aplicación responde mediante un smoke test.
#
# Modos de uso:
#   Sin argumentos  -> Deploy desde una PC: valida y sube también .env.prod.
#   --ci            -> Deploy desde GitHub Actions: reutiliza .env.prod de OCI.
#   --restart       -> Actualiza .env.prod y recrea contenedores SIN compilar.
#   --check         -> Solo valida los archivos y Compose localmente.
#   --test          -> Solo ejecuta el smoke test de producción.
#
# Requisitos importantes:
#   - Ejecutar con Bash >= 4 (por el array asociativo VALUES).
#   - La VM debe tener Docker y Docker Compose disponibles.
#   - En OCI deben existir nginx/certs/fullchain.pem y privkey.pem.
#     Los certificados se instalan MANUALMENTE; este script nunca los copia.
#   - En modo --ci, .env.prod debe existir previamente en REMOTE_DIR.
#   - El runner de GitHub Actions necesita SSH, rsync, curl y acceso a la VM.
#
# El script está pensado para vivir en scripts/deploy.sh dentro del repositorio.
# =============================================================================

# -E: propagar trap ERR; -e: abortar en errores no controlados.
# -u: fallar ante variables no definidas; pipefail: detectar errores en pipes.
set -Eeuo pipefail

# Archivos nuevos (p. ej. temporales) solo accesibles por nuestro usuario.
umask 077

# Resolver la raíz del repositorio sin importar desde dónde se invoque.
cd -- "$(dirname -- "${BASH_SOURCE[0]}")/.."

PHASE="inicio"
ENV_FILE=".env.prod"
COMPOSE_FILE="docker-compose.prod.yml"

# Configuración de la VM. Sobrescribible con variables de entorno del runner
# o de la terminal (sin editar este archivo para cada despliegue).
OCI_HOST="${OCI_HOST:-ganker-oci}"
OCI_USER="${OCI_USER:-opc}"
OCI_SSH_KEY="${OCI_SSH_KEY:-}"
REMOTE_DIR="${REMOTE_DIR:-/home/$OCI_USER/Ganker}"
PUBLIC_URL="${PUBLIC_URL:-https://gankerweb.app}"

# Almacenamos la configuración del .env sin ejecutarla como código Bash.
declare -A VALUES=()

# No mostrar el comando fallido: podría contener credenciales o secretos.
trap 'printf "\nERROR: falló la fase %s (línea %s).\n" "$PHASE" "$LINENO" >&2' ERR

fail() {
  printf 'ERROR: %s\n' "$*" >&2
  exit 1
}

phase() {
  PHASE="$1"
  printf '\n[%s] %s\n' "$1" "$2"
}

# Ejecutar Docker Compose con el archivo y las variables de producción locales.
compose_local() {
  docker compose --env-file "$ENV_FILE" -f "$COMPOSE_FILE" "$@"
}

usage() {
  cat <<'HELP'
Uso (Bash >= 4, Linux):
  bash scripts/deploy.sh            Deploy desde PC (sube código y .env.prod).
  bash scripts/deploy.sh --ci       Deploy desde GitHub Actions (conserva .env.prod remoto).
  bash scripts/deploy.sh --restart  Sube .env.prod y recrea contenedores sin compilar.
  bash scripts/deploy.sh --check    Valida archivos, .env.prod y Docker Compose local.
  bash scripts/deploy.sh --test     Ejecuta solo el smoke test de producción.
  bash scripts/deploy.sh --help     Muestra esta ayuda.

Variables opcionales:
  OCI_HOST      IP o dominio de OCI (predeterminado: 140.238.191.104).
  OCI_USER      Usuario SSH (predeterminado: opc).
  OCI_SSH_KEY   Ruta de la clave privada SSH (si no se indica, usa SSH por defecto).
  REMOTE_DIR    Carpeta destino (predeterminado: /home/$OCI_USER/Ganker).
  PUBLIC_URL    URL pública utilizada por el smoke test.

IMPORTANTE:
  --ci NO necesita Docker ni .env.prod en el runner de GitHub Actions.
  --ci SÍ requiere un .env.prod existente en OCI y acceso SSH configurado.
  Los certificados SSL se cargan a mano y se preservan durante rsync.
HELP
}

# -----------------------------------------------------------------------------
# 1. VALIDACIONES LOCALES
# -----------------------------------------------------------------------------

# Interpretar .env.prod como datos (CLAVE=valor), no mediante source ni eval.
# Así evitamos ejecutar accidentalmente comandos presentes en ese archivo.
read_env() {
  local file="$1" line key value line_number=0
  [[ -f "$file" && -r "$file" ]] || \
    fail "Falta $file. Ejecutá primero: bash scripts/preparar-env-prod.sh"

  while IFS= read -r line || [[ -n "$line" ]]; do
    line_number=$((line_number + 1))
    line=${line%$'\r'}  # Soportar archivos con saltos de línea de Windows.
    [[ "$line" =~ ^[[:space:]]*(#|$) ]] && continue
    [[ "$line" =~ ^([A-Za-z_][A-Za-z0-9_]*)=(.*)$ ]] || \
      fail "$file:$line_number: formato inválido; se espera CLAVE=valor."

    key=${BASH_REMATCH[1]}
    value=${BASH_REMATCH[2]}

    # Quitar comillas simples/dobles envolventes si las hubiera.
    value=${value#\"}; value=${value%\"}
    value=${value#\'}; value=${value%\'}
    VALUES["$key"]="$value"
  done < "$file"
}

# Impedir deploys con secretos vacíos o valores placeholder.
require_key() {
  local key="$1" val="${VALUES[$1]:-}"
  [[ -n "$val" ]] || fail "La variable $key está vacía o falta en $ENV_FILE."

  case "$val" in
    CHANGE_ME*|*reemplazar*|*tu_clave*|*example*)
      fail "$ENV_FILE: debés configurar un valor real para $key."
      ;;
  esac
}

validate_local_environment() {
  local mode="$1" cmd file

  # Los archivos necesarios para construir la aplicación deben existir tanto
  # en despliegues locales como en GitHub Actions.
  for file in \
    "$COMPOSE_FILE" \
    backend/Dockerfile.prod \
    backend/entrypoint.prod.sh \
    nginx/Dockerfile.prod \
    nginx/prod.conf \
    scripts/probar-stack.sh \
    scripts/backup_prod.sh; do
    [[ -f "$file" ]] || fail "Falta el archivo requerido: $file"
  done

  # Solo los modos que contactan OCI necesitan utilidades de red. --check
  # funciona sin configurar SSH, y --test se gestiona por separado.
  if [[ "$mode" != "--check" ]]; then
    for cmd in ssh rsync curl; do
      command -v "$cmd" >/dev/null || fail "Falta '$cmd' en el sistema."
    done
    if [[ "$mode" != "--ci" ]]; then
      command -v scp >/dev/null || fail "Falta 'scp' en el sistema."
    fi
  fi

  if [[ "$mode" == "--ci" ]]; then
    # CI: los secretos ya están en OCI; no leerlos ni transferirlos desde GitHub.
    # Compose se valida después, utilizando el .env.prod real en el servidor.
    printf 'OK: Archivos del proyecto validados (CI; .env.prod remoto).\n'
    return 0
  fi

  # Deploy local, --restart y --check: validar .env.prod antes de transferirlo.
  command -v docker >/dev/null || fail "Falta 'docker' en el sistema."
  docker compose version >/dev/null 2>&1 || fail "Falta el plugin 'docker compose'."
  read_env "$ENV_FILE"

  # Variables críticas para PostgreSQL, autenticación JWT y Owner inicial.
  for cmd in POSTGRES_USER POSTGRES_PASSWORD POSTGRES_DB JWT_SECRET_KEY \
             INITIAL_OWNER_USERNAME INITIAL_OWNER_EMAIL INITIAL_OWNER_PASSWORD; do
    require_key "$cmd"
  done

  if [[ "${VALUES[POSTGRES_USER]}" == "postgres" ]]; then
    printf 'AVISO: Estás usando "postgres" como POSTGRES_USER.\n'
  fi

  # Comprobar sintaxis, variables interpoladas y estructura del archivo Compose.
  compose_local config --quiet
  printf 'OK: %s y %s validados.\n' "$ENV_FILE" "$COMPOSE_FILE"
}

# -----------------------------------------------------------------------------
# 2. ACCESO SSH A ORACLE CLOUD
# -----------------------------------------------------------------------------

setup_ssh() {
  SSH_TARGET="${OCI_USER}@${OCI_HOST}"

  # BatchMode evita solicitudes interactivas: esencial para GitHub Actions.
  # accept-new acepta una clave de host desconocida SOLO la primera vez.
  # En CI de producción se recomienda precargar una huella SSH verificada.
  SSH_OPTS=(-o BatchMode=yes -o ConnectTimeout=10 -o StrictHostKeyChecking=accept-new)

  if [[ -n "$OCI_SSH_KEY" ]]; then
    [[ -f "$OCI_SSH_KEY" ]] || fail "No existe OCI_SSH_KEY: $OCI_SSH_KEY"
    SSH_OPTS+=(-i "$OCI_SSH_KEY" -o IdentitiesOnly=yes)
  fi
}

ssh_remote() {
  ssh "${SSH_OPTS[@]}" "$SSH_TARGET" "$@"
}

wait_for_ssh() {
  local attempt

  # Tolerar pequeñas demoras de red/arranque de OCI: hasta 15 intentos.
  for ((attempt = 1; attempt <= 15; attempt++)); do
    if ssh_remote true 2>/dev/null; then
      printf 'OK: Conexión SSH establecida con %s\n' "$SSH_TARGET"
      return 0
    fi
    sleep 3
  done

  fail "No se pudo conectar por SSH a $SSH_TARGET. Verificá la clave, usuario, red y puerto 22."
}

# -----------------------------------------------------------------------------
# 3. SINCRONIZACIÓN SELECTIVA (RSYNC)
# -----------------------------------------------------------------------------

sync_project_to_oci() {
  local mode="$1" rsync_ssh

  # Crear directorios privados; nunca borrar certificados, respaldos o medios.
  ssh_remote "umask 077; mkdir -p '$REMOTE_DIR/nginx/certs' '$REMOTE_DIR/backups' '$REMOTE_DIR/scripts'; chmod 700 '$REMOTE_DIR'"

  # Construir la orden SSH sin romper rutas a claves que contienen espacios.
  printf -v rsync_ssh '%q ' ssh "${SSH_OPTS[@]}"
  rsync_ssh=${rsync_ssh% }

  # El ORDEN DE LAS REGLAS IMPORTA: rsync aplica la primera coincidencia.
  # Primero protegemos los datos persistentes del receptor (P).
  # Luego excluimos archivos de desarrollo y secretos locales.
  # Por último incluimos solo los directorios/archivos de producción.
  #
  # --delete elimina archivos obsoletos dentro del contenido sincronizado;
  # --delete-excluded también elimina excluidos NO protegidos (por ejemplo,
  # node_modules subidos por error). Los filtros P impiden tocar datos críticos.
  rsync -az --delete --delete-excluded \
    -e "$rsync_ssh" \
    --filter='P /backups/***' \
    --filter='P /nginx/certs/***' \
    --filter='P /backend/media/***' \
    --filter='P /.env.prod' \
    --filter='P /.env' \
    --exclude='.git/' \
    --exclude='.github/' \
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
    --exclude='/backend/media/***' \
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
    --exclude='*' \
    ./ "$SSH_TARGET:$REMOTE_DIR/"

  if [[ "$mode" != "--ci" ]]; then
    # Solo fuera de CI se transfiere .env.prod; no se sincroniza por rsync.
    # Separar la copia reduce el riesgo de incluirlo en otros despliegues.
    scp "${SSH_OPTS[@]}" "$ENV_FILE" "$SSH_TARGET:$REMOTE_DIR/.env.prod"
  fi

  # En CI exigimos que .env.prod exista en OCI; nunca lo creamos en el runner.
  # Se conserva el enlace .env -> .env.prod que espera parte del proyecto.
  ssh_remote "test -s '$REMOTE_DIR/.env.prod' && chmod 600 '$REMOTE_DIR/.env.prod' && chmod +x '$REMOTE_DIR/scripts/backup_prod.sh' && ln -sf .env.prod '$REMOTE_DIR/.env'" || \
    fail "No se pudo preparar el .env.prod remoto. En --ci debe existir previamente en $REMOTE_DIR."

  printf 'OK: Archivos de producción sincronizados en %s:%s\n' "$SSH_TARGET" "$REMOTE_DIR"
}

# -----------------------------------------------------------------------------
# 4. BUILD Y ACTUALIZACIÓN DE LOS CONTENEDORES EN OCI
# -----------------------------------------------------------------------------

deploy_remote_stack() {
  local mode="$1"

  # El heredoc entrecomillado no expande variables locales ni secretos.
  # Los argumentos se leen en la VM; las imágenes se construyen allí (ARM64).
  ssh_remote "bash -se -- '$REMOTE_DIR' '$mode'" <<'REMOTE'
set -Eeuo pipefail
REMOTE_DIR=$1
MODE=$2

cd "$REMOTE_DIR"

remote_fail() { printf 'ERROR: %s\n' "$*" >&2; exit 1; }

# Comprobar acceso a Docker. Usar sudo no interactivo solo si hace falta.
DOCKER_CMD=(docker)
if ! docker info >/dev/null 2>&1; then
  if sudo -n docker info >/dev/null 2>&1; then
    DOCKER_CMD=(sudo -n docker)
  else
    remote_fail "Docker no está disponible para el usuario SSH (ni con sudo -n)."
  fi
fi

# Los archivos sensibles son gestionados fuera del deploy:
# - .env.prod ya reside en OCI cuando MODE=--ci.
# - Los certificados Cloudflare Origin/SSL se suben manualmente.
# Nunca intentamos recuperar certificados de otras carpetas ni copiarlos.
[[ -s .env.prod ]] || remote_fail "Falta .env.prod (o está vacío) en $REMOTE_DIR."
[[ -s nginx/certs/fullchain.pem && -s nginx/certs/privkey.pem ]] || \
  remote_fail "Faltan certificados SSL en $REMOTE_DIR/nginx/certs/."
chmod 600 .env.prod nginx/certs/fullchain.pem nginx/certs/privkey.pem

# Validar Compose CONTRA la configuración que realmente usará producción.
"${DOCKER_CMD[@]}" compose --env-file .env.prod -f docker-compose.prod.yml config --quiet

# Compilar las imágenes directamente en OCI, aprovechando su arquitectura
# ARM64. --pull intenta obtener versiones recientes de las imágenes base.
# En --restart se reutilizan las imágenes ya construidas.
if [[ "$MODE" != "--restart" ]]; then
  echo "[*] Compilando imágenes de producción en OCI (ARM64)..."
  "${DOCKER_CMD[@]}" compose --env-file .env.prod -f docker-compose.prod.yml build --pull
fi

# -d: segundo plano | --remove-orphans: quitar servicios antiguos del Compose.
# --wait: esperar servicios activos/healthchecks | timeout: 180 segundos.
# --restart fuerza la RECREACIÓN para aplicar la nueva configuración/env sin
# recompilar; un simple 'up -d' podría no reiniciar un contenedor sin cambios.
COMPOSE_UP_ARGS=(up -d --remove-orphans --wait --wait-timeout 180)
if [[ "$MODE" == "--restart" ]]; then
  COMPOSE_UP_ARGS+=(--force-recreate --no-build)
fi

echo "[*] Actualizando contenedores de Ganker..."
if ! "${DOCKER_CMD[@]}" compose --env-file .env.prod -f docker-compose.prod.yml "${COMPOSE_UP_ARGS[@]}"; then
  echo "[ERROR] Falló Docker Compose. Estado y últimos logs de TODOS los servicios:" >&2
  "${DOCKER_CMD[@]}" compose --env-file .env.prod -f docker-compose.prod.yml ps -a || true
  "${DOCKER_CMD[@]}" compose --env-file .env.prod -f docker-compose.prod.yml logs --tail=100 || true
  exit 1
fi

# Eliminar solamente imágenes colgantes (dangling), NO volúmenes ni bases de datos.
"${DOCKER_CMD[@]}" image prune -f >/dev/null 2>&1 || true
"${DOCKER_CMD[@]}" compose --env-file .env.prod -f docker-compose.prod.yml ps
REMOTE
}

# -----------------------------------------------------------------------------
# 5. ORQUESTACIÓN Y SMOKE TEST
# -----------------------------------------------------------------------------

main() {
  local mode="${1:-}"

  [[ $# -le 1 ]] || fail "Demasiados argumentos. Usá --help para ver las opciones."

  case "$mode" in
    -h|--help)
      usage
      return 0
      ;;
    --test)
      # No accede por SSH ni necesita Docker local: prueba la URL desplegada.
      [[ -f scripts/probar-stack.sh ]] || fail "Falta scripts/probar-stack.sh."
      phase TEST "Ejecutando smoke test contra $PUBLIC_URL"
      bash scripts/probar-stack.sh "$PUBLIC_URL"
      return 0
      ;;
    --check|--restart|--ci|'')
      ;;
    *)
      usage >&2
      fail "Opción desconocida: $mode"
      ;;
  esac

  phase 1 "Validando archivos y requisitos (${mode:-local})"
  validate_local_environment "$mode"
  [[ "$mode" != "--check" ]] || return 0

  phase 2 "Verificando acceso SSH a OCI ($OCI_USER@$OCI_HOST)"
  setup_ssh
  wait_for_ssh

  phase 3 "Sincronizando archivos de producción hacia $REMOTE_DIR"
  sync_project_to_oci "$mode"

  phase 4 "Construyendo/actualizando Docker Compose en OCI (ARM64)"
  deploy_remote_stack "$mode"

  # No damos el despliegue por exitoso hasta que pase la prueba HTTP pública.
  phase 5 "Ejecutando smoke test contra $PUBLIC_URL"
  bash scripts/probar-stack.sh "$PUBLIC_URL"

  # Notificar los cambios a IndexNow.
  # No es necesario hacerlo con --restart porque no recompila el frontend.
  if [[ "$mode" != "--restart" ]]; then
    phase 6 "Notificando a IndexNow"

    if curl -fsS --retry 2 --max-time 15 -G \
      "https://api.indexnow.org/indexnow" \
      --data-urlencode "url=https://gankerweb.app/" \
      --data-urlencode "key=0b3bd0e9332aa05e19d7f5dd50ae589b"; then

      printf '\nOK: IndexNow recibió la notificación.\n'
    else
      printf '\nAVISO: No se pudo notificar a IndexNow.\n' >&2
    fi
  fi

  printf '\n=================================================================\n'
  printf ' DESPLIEGUE DE GANKER COMPLETADO: %s\n' "$PUBLIC_URL"
  printf '=================================================================\n'
}

main "$@"
