import { useCallback, useEffect, useRef, useState } from "react";
import { crearNotificacionesSocket } from "../api/chatSocketApi";

const MAX_INTENTOS_RECONEXION = 6;
const TIPO_NUEVO_MENSAJE = "NEW_MESSAGE_NOTIFICATION";

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

      if (data.type === TIPO_NUEVO_MENSAJE) {
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
