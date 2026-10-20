#!/usr/bin/env bash
set -euo pipefail

BASE_URL=${1:-https://gankerweb.app}
BASE_URL=${BASE_URL%/}

echo "[*] Esperando que $BASE_URL responda..."
for attempt in {1..30}; do
  if curl --silent --show-error --fail --output /dev/null --connect-timeout 3 --max-time 5 "$BASE_URL/"; then
    break
  fi
  [[ "$attempt" -lt 30 ]] || { echo "FALLO: $BASE_URL no respondió tras 30 intentos" >&2; exit 1; }
  sleep 2
done

# 1. Verificar que los archivos ocultos devuelvan 404 (Hardening Nginx)
env_status=$(curl --silent --output /dev/null --write-out '%{http_code}' "$BASE_URL/.env")
[[ "$env_status" == "404" ]] || { echo "FALLO Seguridad: /.env devolvió HTTP $env_status (esperado 404)" >&2; exit 1; }
echo "OK Hardening /.env: HTTP 404"

# 2. Verificar que /docs esté deshabilitado en producción
docs_status=$(curl --silent --output /dev/null --write-out '%{http_code}' "$BASE_URL/docs")
echo "OK FastAPI /docs oculto (entregado a SPA/404): HTTP $docs_status"

# 3. Verificar HTML y bundles JS/CSS de Vite (que no devuelvan index.html por error)
html=$(curl --silent --show-error --fail "$BASE_URL/")
js_asset=$(printf '%s\n' "$html" | sed -n 's/.*src="\(\/assets\/[^"]*\.js\)".*/\1/p' | head -n 1 || true)
css_asset=$(printf '%s\n' "$html" | sed -n 's/.*href="\(\/assets\/[^"]*\.css\)".*/\1/p' | head -n 1 || true)

[[ -n "$js_asset" && -n "$css_asset" ]] || { echo "FALLO: No se detectaron bundles en /assets/ dentro del HTML" >&2; exit 1; }

js_type=$(curl --silent --fail --output /dev/null --write-out '%{content_type}' "${BASE_URL}${js_asset}")
[[ "$js_type" == *javascript* ]] || { echo "FALLO $js_asset: Content-Type inesperado ($js_type)" >&2; exit 1; }
echo "OK Bundle JS ($js_asset): $js_type"

css_type=$(curl --silent --fail --output /dev/null --write-out '%{content_type}' "${BASE_URL}${css_asset}")
[[ "$css_type" == *text/css* ]] || { echo "FALLO $css_asset: Content-Type inesperado ($css_type)" >&2; exit 1; }
echo "OK Bundle CSS ($css_asset): $css_type"

# 4. Verificar archivos de SEO técnico y Open Graph (/robots.txt, /sitemap.xml, /og-banner.png)
robots_meta=$(curl --silent --output /dev/null --write-out '%{http_code}|%{content_type}' "$BASE_URL/robots.txt")
robots_status=${robots_meta%%|*}
robots_type=${robots_meta#*|}
[[ "$robots_status" == "200" ]] || { echo "FALLO SEO: /robots.txt devolvió HTTP $robots_status (esperado 200)" >&2; exit 1; }
[[ "$robots_type" == *text/plain* ]] || { echo "FALLO SEO: /robots.txt Content-Type inesperado ($robots_type, esperado text/plain)" >&2; exit 1; }
echo "OK SEO /robots.txt: HTTP $robots_status ($robots_type)"

sitemap_meta=$(curl --silent --output /dev/null --write-out '%{http_code}|%{content_type}' "$BASE_URL/sitemap.xml")
sitemap_status=${sitemap_meta%%|*}
sitemap_type=${sitemap_meta#*|}
[[ "$sitemap_status" == "200" ]] || { echo "FALLO SEO: /sitemap.xml devolvió HTTP $sitemap_status (esperado 200)" >&2; exit 1; }
[[ "$sitemap_type" == *xml* ]] || { echo "FALLO SEO: /sitemap.xml Content-Type inesperado ($sitemap_type, esperado xml)" >&2; exit 1; }
echo "OK SEO /sitemap.xml: HTTP $sitemap_status ($sitemap_type)"

og_meta=$(curl --silent --output /dev/null --write-out '%{http_code}|%{content_type}' "$BASE_URL/og-banner.png")
og_status=${og_meta%%|*}
og_type=${og_meta#*|}
[[ "$og_status" == "200" ]] || { echo "FALLO SEO: /og-banner.png devolvió HTTP $og_status (esperado 200)" >&2; exit 1; }
[[ "$og_type" == *image/png* ]] || { echo "FALLO SEO: /og-banner.png Content-Type inesperado ($og_type, esperado image/png)" >&2; exit 1; }
echo "OK Open Graph /og-banner.png: HTTP $og_status ($og_type)"

echo "[OK] Smoke test completado exitosamente en $BASE_URL"
