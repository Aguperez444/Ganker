import { useCallback, useEffect, useRef, useState } from "react";
import { urlWebSocket } from "../utils/websocket";

const MAX_INTENTOS_RECONEXION = 6;

/**
 * US 10 - Notificaciones de mensajes en vivo.
 *
 * Conexion persistente a /api/v1/ws/notifications: se abre una sola vez por
 * sesion (la usa ChatContext, no cada pantalla) y avisa cuando llega un
 * mensaje nuevo en CUALQUIER conversacion del jugador, este viendola o no.
 *
 * Misma estructura que useChatSocket (reconexion con backoff, token fresco
 * de localStorage en cada intento), pero mas simple: no manda mensajes, solo
 * escucha.
 */
export function useNotificacionesSocket(token, onNotificacion) {
  const [conectado, setConectado] = useState(false);

  const socketRef = useRef(null);
  const intentosRef = useRef(0);
  const reintentoTimeoutRef = useRef(null);
  const onNotificacionRef = useRef(onNotificacion);
  const conectarRef = useRef(() => {});

  useEffect(() => {
    onNotificacionRef.current = onNotificacion;
  }, [onNotificacion]);

  const conectar = useCallback(() => {
    if (!token) return;

    if (
      socketRef.current &&
      (socketRef.current.readyState === WebSocket.OPEN ||
        socketRef.current.readyState === WebSocket.CONNECTING)
    ) {
      return;
    }

    const socket = new WebSocket(
      urlWebSocket(
        `/api/v1/ws/notifications?token=${encodeURIComponent(token)}`
      )
    );
    socketRef.current = socket;

    socket.onopen = () => {
      if (socketRef.current !== socket) return;
      setConectado(true);
      intentosRef.current = 0;
    };

    socket.onmessage = (event) => {
      if (socketRef.current !== socket) return;

      let data;
      try {
        data = JSON.parse(event.data);
      } catch {
        return;
      }

      if (data.type === "NEW_MESSAGE_NOTIFICATION") {
        onNotificacionRef.current?.(data);
      }
    };

    socket.onclose = (event) => {
      if (socketRef.current !== socket) return;

      setConectado(false);
      socketRef.current = null;

      // 1008 = Policy Violation (token invalido o vencido): reintentar no
      // sirve de nada hasta que haya sesion de nuevo.
      if (event.code === 1008) return;

      if (intentosRef.current < MAX_INTENTOS_RECONEXION) {
        const espera = Math.min(1000 * 2 ** intentosRef.current, 15000);
        intentosRef.current += 1;
        reintentoTimeoutRef.current = setTimeout(
          () => conectarRef.current(),
          espera
        );
      }
    };
  }, [token]);

  useEffect(() => {
    conectarRef.current = conectar;
  }, [conectar]);

  useEffect(() => {
    conectarRef.current();

    return () => {
      if (reintentoTimeoutRef.current)
        clearTimeout(reintentoTimeoutRef.current);

      const socket = socketRef.current;
      if (socket) {
        socketRef.current = null;
        socket.onmessage = null;
        socket.onclose = null;

        if (socket.readyState === WebSocket.OPEN) {
          socket.close(1000, "Sesión cerrada");
        } else if (socket.readyState === WebSocket.CONNECTING) {
          // Cerrar un socket que todavia esta conectando dispara en la
          // consola "WebSocket is closed before the connection is
          // established". Difiriendo el cierre a onopen evitamos ese ruido.
          socket.onopen = () => socket.close(1000, "Sesión cerrada");
        }
      }
      setConectado(false);
    };
  }, [conectar]);

  return conectado;
}

export default useNotificacionesSocket;
