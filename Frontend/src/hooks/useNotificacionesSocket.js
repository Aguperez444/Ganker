import { useCallback, useEffect, useRef, useState } from "react";
import { crearNotificacionesSocket } from "../api/chatSocketApi";

const MAX_INTENTOS_RECONEXION = 6;
// Mensaje nuevo en un chat privado o en el chatroom de un equipo (US 44):
// los dos traen { conversation_id, sender_id, content, timestamp }.
const TIPOS_NUEVO_MENSAJE = [
  "NEW_MESSAGE_NOTIFICATION",
  "NEW_CHATROOM_MESSAGE_NOTIFICATION",
];

// Cambios en el equipo del jugador (alguien se unio, salio, fue expulsado,
// cambio el lider, se disolvio o se marco inactivo). El backend se los manda
// a los integrantes para que la vista del equipo se actualice sola.
const TIPOS_EVENTO_EQUIPO = [
  "TEAM_JOINED_NOTIFICATION",
  "TEAM_NEW_MEMBER_NOTIFICATION",
  "TEAM_MEMBER_LEFT_NOTIFICATION",
  "TEAM_MEMBER_KICKED_NOTIFICATION",
  "TEAM_LEADERSHIP_TRANSFERRED_NOTIFICATION",
  "TEAM_DELETED_NOTIFICATION",
  "TEAM_DEACTIVATED_NOTIFICATION",
];

export function useNotificacionesSocket(token, onNotificacion, onEventoEquipo) {
  const [conectado, setConectado] = useState(false);

  const socketRef = useRef(null);
  const intentosRef = useRef(0);
  const reintentoTimeoutRef = useRef(null);
  const onNotificacionRef = useRef(onNotificacion);
  const onEventoEquipoRef = useRef(onEventoEquipo);
  const conectarRef = useRef(() => {});

  useEffect(() => {
    onNotificacionRef.current = onNotificacion;
  }, [onNotificacion]);

  useEffect(() => {
    onEventoEquipoRef.current = onEventoEquipo;
  }, [onEventoEquipo]);

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

      if (TIPOS_NUEVO_MENSAJE.includes(data.type)) {
        onNotificacionRef.current?.(data);
      } else if (TIPOS_EVENTO_EQUIPO.includes(data.type)) {
        onEventoEquipoRef.current?.(data);
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
