import { useCallback } from "react";
import {
  obtenerHistorialChatroom,
  obtenerHistorialMensajes,
} from "../api/chatApi";

// `tipo`: "privada" (chat entre dos jugadores) o "equipo" (chatroom del
// equipo, US 45). Cada uno tiene su propio endpoint de historial.
export function useChatHistory(conversationId, tipo = "privada") {
  const cargarPaginaHistorial = useCallback(
    async ({ page = 1, size = 50 } = {}) => {
      const obtener =
        tipo === "equipo" ? obtenerHistorialChatroom : obtenerHistorialMensajes;
      const mensajes = await obtener(conversationId, {
        page,
        size,
      });

      // El backend devuelve del más nuevo al más viejo.
      // La UI trabaja del más viejo al más nuevo.
      return [...mensajes].reverse();
    },
    [conversationId, tipo]
  );

  return {
    cargarPaginaHistorial,
  };
}

export default useChatHistory;
