import { useCallback, useEffect, useRef, useState } from "react";
import { crearNotificacionesSocket } from "../api/chatSocketApi";

export const TIPOS_NOTIFICACION = {
  NEW_MESSAGE: "NEW_MESSAGE_NOTIFICATION",
  NEW_CHATROOM_MESSAGE: "NEW_CHATROOM_MESSAGE_NOTIFICATION",
  TEAM_JOINED: "TEAM_JOINED_NOTIFICATION",
  TEAM_NEW_MEMBER: "TEAM_NEW_MEMBER_NOTIFICATION",
  MESSAGES_READ: "MESSAGES_READ_NOTIFICATION",
};

const TIPOS_SOPORTADOS = new Set(Object.values(TIPOS_NOTIFICACION));

const MAX_INTENTOS_RECONEXION = 5;

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

    const socket = crearNotificacionesSocket(token);

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

      if (TIPOS_SOPORTADOS.has(data.type)) {
        onNotificacionRef.current?.(data);
      }
    };

    socket.onclose = (event) => {
      if (socketRef.current !== socket) return;

      setConectado(false);
      socketRef.current = null;

      if (event.code === 1008) {
        return;
      }

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
      if (reintentoTimeoutRef.current) {
        clearTimeout(reintentoTimeoutRef.current);
      }

      const socket = socketRef.current;

      if (!socket) {
        setConectado(false);
        return;
      }

      socketRef.current = null;
      socket.onmessage = null;
      socket.onclose = null;

      if (socket.readyState === WebSocket.OPEN) {
        socket.close(1000, "Sesión cerrada");
      } else if (socket.readyState === WebSocket.CONNECTING) {
        socket.onopen = () => socket.close(1000, "Sesión cerrada");
      }

      setConectado(false);
    };
  }, [conectar]);

  return conectado;
}

export default useNotificacionesSocket;
