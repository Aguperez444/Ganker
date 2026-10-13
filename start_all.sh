#!/usr/bin/env bash
set -e

SCRIPT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
BACKEND_DIR="$SCRIPT_DIR/backend"
FRONTEND_DIR="$SCRIPT_DIR/Frontend"

# Detectar el emulador de terminal disponible
detect_terminal() {
    if command -v ptyxis >/dev/null 2>&1; then
        echo "ptyxis"
    elif command -v gnome-terminal >/dev/null 2>&1; then
        echo "gnome-terminal"
    elif command -v kitty >/dev/null 2>&1; then
        echo "kitty"
    elif command -v alacritty >/dev/null 2>&1; then
        echo "alacritty"
    elif command -v konsole >/dev/null 2>&1; then
        echo "konsole"
    elif command -v xterm >/dev/null 2>&1; then
        echo "xterm"
    else
        echo ""
    fi
}

TERMINAL="$(detect_terminal)"

if [ -z "$TERMINAL" ]; then
    echo "Error: No se encontró ningún emulador de terminal compatible instalado."
    exit 1
fi

launch_terminal() {
    local title="$1"
    local workdir="$2"
    local run_cmd="$3"

    # Encapsulamos el comando para entrar al directorio y pausar si falla o termina
    local full_cmd="cd \"$workdir\" && echo '=== Iniciando $title ===' && $run_cmd; exec bash"

    case "$TERMINAL" in
        ptyxis)
            ptyxis --new-window --title="$title" --working-directory="$workdir" -- bash -c "$full_cmd" &
            ;;
        gnome-terminal)
            gnome-terminal --title="$title" --working-directory="$workdir" -- bash -c "$full_cmd" &
            ;;
        kitty)
            kitty --title "$title" --directory "$workdir" bash -c "$full_cmd" &
            ;;
        alacritty)
            alacritty --title "$title" --working-directory "$workdir" -e bash -c "$full_cmd" &
            ;;
        konsole)
            konsole --new-tab -p tabtitle="$title" --workdir "$workdir" -e bash -c "$full_cmd" &
            ;;
        xterm)
            xterm -T "$title" -e bash -c "$full_cmd" &
            ;;
    esac
}

echo "Usando terminal: $TERMINAL"

# Lanzar Backend
CMD_BACKEND="PYTHONUNBUFFERED=1 PYTHONPATH=\"$BACKEND_DIR\" \"$BACKEND_DIR/.venv/bin/python\" app/infrastructure/start/main.py"
launch_terminal "Backend" "$BACKEND_DIR" "$CMD_BACKEND"
echo "Backend lanzado en una terminal separada."

# Lanzar Frontend
CMD_FRONTEND="npm run dev"
launch_terminal "Frontend" "$FRONTEND_DIR" "$CMD_FRONTEND"
echo "Frontend lanzado en una terminal separada."

echo ""
echo "Ambos servicios están corriendo en ventanas independientes."
