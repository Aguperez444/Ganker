import axiosClient from "./axiosClient";

// Idempotente: si ya existe una conversacion con ese jugador, el backend
// devuelve la misma en vez de crear una nueva.
export function iniciarConversacion(targetUserId) {
  return axiosClient
    .post("/api/v1/chat", { target_user_id: targetUserId })
    .then((res) => res.data);
}

export function obtenerConversaciones() {
  return axiosClient
    .get("/api/v1/chat/conversations")
    .then((res) => res.data.conversations);
}

// El backend devuelve los mensajes del mas nuevo al mas viejo.
export function obtenerHistorialMensajes(
  conversationId,
  { page = 1, size = 50 } = {}
) {
  return axiosClient
    .get(`/api/v1/chat/conversations/${conversationId}/messages`, {
      params: { page, size },
    })
    .then((res) => res.data.messages);
}

export function marcarConversacionComoLeida(conversationId) {
  return axiosClient
    .patch(`/api/v1/chat/conversations/${conversationId}/read`)
    .then((res) => res.data);
}

/**
 * Chatrooms Grupales (Chat de Equipo) - Guía v2
 */
export function obtenerChatrooms() {
  return axiosClient
    .get("/api/v1/chat/chatroom")
    .then((res) => res.data.chatrooms);
}

export function obtenerHistorialChatroom(
  chatroomId,
  { page = 1, size = 30 } = {}
) {
  return axiosClient
    .get(`/api/v1/chat/chatroom/${chatroomId}/messages`, {
      params: { page, size },
    })
    .then((res) => res.data.messages);
}

export function marcarChatroomComoLeido(chatroomId) {
  return axiosClient
    .patch(`/api/v1/chat/chatroom/${chatroomId}/read`)
    .then((res) => res.data);
}
