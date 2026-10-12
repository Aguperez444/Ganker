import { useCallback, useEffect, useRef, useState } from "react";
import { CLAVES_SESION } from "../api/axiosClient";
import { crearEquiposFeedSocket } from "../api/teamSocketApi";

const MAX_INTENTOS_RECONEXION = 6;

// Eventos que publica el backend en el feed y que afectan al listado de
// equipos: alta, modificación y cambios de integrantes.
const TIPOS_DE_EQUIPOS = new Set([
  "TEAM_CREATED",
  "TEAM_UPDATED",
  "TEAM_MEMBER_JOINED",
  "TEAM_MEMBER_LEFT",
  "TEAM_MEMBER_KICKED",
]);

// Suscribe al feed en vivo del listado de equipos. Cada evento relevante
// dispara `onEvento(evento)` para que la vista vuelva a consultar el listado
// (criterio 10 de la US 04: el listado general de equipos se actualiza).
//
// Es el mismo patrón que useNotificacionesSocket (ref para el callback y
// reconexión con backoff), pero lee el token de localStorage como
// useChatSocket: el feed no depende de AuthContext y así la página no necesita
// envolverse en el provider para usarlo. Si no hay sesión, no conecta.
export function useEquiposFeedSocket(onEvento) {
  const [conectado, setConectado] = useState(false);

  const socketRef = useRef(null);
  const intentosRef = useRef(0);
  const reintentoTimeoutRef = useRef(null);
  const onEventoRef = useRef(onEvento);
  const conectarRef = useRef(() => {});

  useEffect(() => {
    onEventoRef.current = onEvento;
  }, [onEvento]);

  const conectar = useCallback(() => {
    const token = localStorage.getItem(CLAVES_SESION.access);
    if (!token) return;

    if (
      socketRef.current &&
      (socketRef.current.readyState === WebSocket.OPEN ||
        socketRef.current.readyState === WebSocket.CONNECTING)
    ) {
      return;
    }

    const socket = crearEquiposFeedSocket(token);

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

      if (TIPOS_DE_EQUIPOS.has(data?.type)) {
        onEventoRef.current?.(data);
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
  }, []);

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
        socket.close(1000, "Salida del listado de equipos");
      } else if (socket.readyState === WebSocket.CONNECTING) {
        socket.onopen = () =>
          socket.close(1000, "Salida del listado de equipos");
      }

      setConectado(false);
    };
  }, [conectar]);

  return conectado;
}

export default useEquiposFeedSocket;
