#!/usr/bin/env bash
set -euo pipefail
umask 077

cd -- "$(dirname -- "${BASH_SOURCE[0]}")/.."

if [[ -e .env.prod ]]; then
  printf 'Ya existe .env.prod. No se sobrescribe para proteger tus credenciales.\n' >&2
  exit 1
fi

[[ -f .env.prod.example ]] || { echo 'Falta .env.prod.example' >&2; exit 1; }
command -v openssl >/dev/null || { echo 'Falta openssl' >&2; exit 1; }

db_pass=$(openssl rand -hex 24)
jwt_secret=$(openssl rand -hex 32)
owner_pass=$(openssl rand -base64 18 | tr -d '/+=')

cp .env.prod.example .env.prod
sed -i "s|^POSTGRES_PASSWORD=.*|POSTGRES_PASSWORD=${db_pass}|" .env.prod
sed -i "s|^JWT_SECRET_KEY=.*|JWT_SECRET_KEY=${jwt_secret}|" .env.prod
sed -i "s|^INITIAL_OWNER_PASSWORD=.*|INITIAL_OWNER_PASSWORD=${owner_pass}|" .env.prod

chmod 600 .env.prod
printf 'Creado .env.prod (permisos 600) con claves generadas por OpenSSL.\n'
printf 'Password inicial del Owner: %s (guardalo y completá las keys de OAuth/Resend en .env.prod)\n' "$owner_pass"
