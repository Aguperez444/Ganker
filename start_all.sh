#!/usr/bin/env bash
set -e

SCRIPT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"

BACKEND_DIR="$SCRIPT_DIR/Backend"
FRONTEND_DIR="$SCRIPT_DIR/Frontend"

echo "Levantando backend..."
cd "$BACKEND_DIR"

PYTHONUNBUFFERED=1 PYTHONPATH="$BACKEND_DIR" "$BACKEND_DIR/.venv/bin/python" app/infrastructure/start/main.py &
BACKEND_PID=$!

echo "Backend iniciado con PID $BACKEND_PID"

echo "Levantando frontend..."
cd "$FRONTEND_DIR"

npm run dev &
FRONTEND_PID=$!

echo "Frontend iniciado con PID $FRONTEND_PID"

echo ""
echo "Aplicación levantada."
echo "Backend PID:  $BACKEND_PID"
echo "Frontend PID: $FRONTEND_PID"
echo ""
echo "Presioná CTRL+C para apagar ambos."

trap "echo ''; echo 'Apagando backend y frontend...'; kill $BACKEND_PID $FRONTEND_PID 2>/dev/null; exit" INT TERM

wait
