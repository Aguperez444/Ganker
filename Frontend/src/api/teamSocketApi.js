import { urlWebSocket } from "../utils/websocket";

// Capa de acceso WebSocket del feed de equipos. Igual que con el chat, la
// creación de conexiones crudas vive en api/ y el ciclo de vida (reconexión,
// estado) en el hook useEquiposFeedSocket.
//
// El backend publica en /api/v1/ws/teams un evento cada vez que se crea,
// modifica o cambia la membresía de un equipo (ver teams_feed_manager). El
// endpoint no valida token, pero lo mandamos por consistencia con el resto de
// los sockets.
export function crearEquiposFeedSocket(token) {
  return new WebSocket(
    urlWebSocket(`/api/v1/ws/teams?token=${encodeURIComponent(token)}`)
  );
}
