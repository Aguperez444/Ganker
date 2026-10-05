import { urlWebSocket } from "../utils/websocket";

/**
 * Crea la conexion WebSocket para el feed en tiempo real de equipos (Lobby).
 */
export function crearTeamsSocket() {
  const url = urlWebSocket("/api/v1/ws/teams");
  return new WebSocket(url);
}
