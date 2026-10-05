import { useCallback } from "react";
import {
  obtenerHistorialMensajes,
  obtenerHistorialChatroom,
} from "../api/chatApi";

export function useChatHistory(conversationId, isChatroom = false) {
  const cargarPaginaHistorial = useCallback(
    async ({ page = 1, size = 50 } = {}) => {
      const mensajes = isChatroom
        ? await obtenerHistorialChatroom(conversationId, { page, size })
        : await obtenerHistorialMensajes(conversationId, { page, size });

      // El backend devuelve del más nuevo al más viejo.
      // La UI trabaja del más viejo al más nuevo.
      return [...mensajes].reverse();
    },
    [conversationId, isChatroom]
  );

  return {
    cargarPaginaHistorial,
  };
}

export default useChatHistory;
