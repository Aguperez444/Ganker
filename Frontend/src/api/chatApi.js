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
export function obtenerHistorialMensajes(conversationId, { page = 1, size = 50 } = {}) {
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
