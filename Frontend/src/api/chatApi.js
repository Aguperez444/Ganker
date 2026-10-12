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

// US 44/45 - Chatroom (chat grupal) del equipo. Mismo esquema que el chat
// privado pero con sus propios endpoints: el backend rechaza los chatrooms
// en los de conversaciones privadas y viceversa. Solo los integrantes del
// equipo pueden leerlos (lo valida el backend).

// Chatrooms del jugador logueado:
// [{ chatroom_id, team_id, name, icon_url, member_count, last_message,
//    unread_count }]
export function obtenerChatrooms() {
  return axiosClient
    .get("/api/v1/chat/chatroom")
    .then((res) => res.data.chatrooms);
}

// Igual que el privado: del mas nuevo al mas viejo. Cada mensaje trae
// sender_username, sender_name y sender_icon_url (en un grupo hay que mostrar
// quien escribio).
export function obtenerHistorialChatroom(
  chatroomId,
  { page = 1, size = 50 } = {}
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
