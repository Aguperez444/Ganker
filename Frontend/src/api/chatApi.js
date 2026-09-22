import axiosClient from "./axiosClient";

// US 10 - Iniciar conversacion privada.
// Idempotente: si ya existe una conversacion con ese jugador, el backend
// devuelve la misma en vez de crear una nueva.
export function iniciarConversacion(targetUserId) {
  return axiosClient
    .post("/api/v1/chat", { target_user_id: targetUserId })
    .then((res) => res.data); // { conversation_id, player_1_id, player_2_id }
}

// Lista las conversaciones del jugador logueado, con el otro participante y
// el ultimo mensaje de cada una (o null si todavia nadie escribio).
export function obtenerConversaciones() {
  return axiosClient
    .get("/api/v1/chat/conversations")
    .then((res) => res.data.conversations);
}
