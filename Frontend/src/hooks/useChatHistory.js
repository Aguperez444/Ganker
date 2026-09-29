import { useCallback } from "react";
import { obtenerHistorialMensajes } from "../api/chatApi";

export function useChatHistory(conversationId) {
  const cargarPaginaHistorial = useCallback(
    async ({ page = 1, size = 50 } = {}) => {
      const mensajes = await obtenerHistorialMensajes(conversationId, {
        page,
        size,
      });

      // El backend devuelve del más nuevo al más viejo.
      // La UI trabaja del más viejo al más nuevo.
      return [...mensajes].reverse();
    },
    [conversationId]
  );

  return {
    cargarPaginaHistorial,
  };
}

export default useChatHistory;
