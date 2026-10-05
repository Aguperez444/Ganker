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

export function crearChatroomSocket(chatroomId, token) {
  return new WebSocket(
    urlWebSocket(
      `/api/v1/ws/chat/chatroom/${chatroomId}?token=${encodeURIComponent(
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
