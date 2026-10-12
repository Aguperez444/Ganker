import { urlWebSocket } from "../utils/websocket";

/**
 * Capa de acceso WebSocket del chat.
 *
 * La creación de conexiones crudas pertenece a api/, igual que las llamadas
 * HTTP del chat viven en chatApi.js.
 *
 * Los hooks se ocupan del ciclo de vida, reconexión y estado de React.
 */
export function crearChatSocket(conversationId, token) {
  return new WebSocket(
    urlWebSocket(
      `/api/v1/ws/chat/conversations/${conversationId}?token=${encodeURIComponent(
        token
      )}`
    )
  );
}

export function crearNotificacionesSocket(token) {
  return new WebSocket(
    urlWebSocket(`/api/v1/ws/notifications?token=${encodeURIComponent(token)}`)
  );
}

// US 44 - Socket del chatroom de un equipo. Mismo protocolo que el privado:
// se envia { content } y llegan los mensajes guardados. El backend cierra con
// 1008 si el jugador no es integrante, y con 1000 cuando el equipo se disuelve.
export function crearChatroomSocket(chatroomId, token) {
  return new WebSocket(
    urlWebSocket(
      `/api/v1/ws/chat/chatroom/${chatroomId}?token=${encodeURIComponent(token)}`
    )
  );
}
