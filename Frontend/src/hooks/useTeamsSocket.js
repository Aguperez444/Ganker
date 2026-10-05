import { useCallback, useEffect, useRef, useState } from "react";
import { crearTeamsSocket } from "../api/teamsSocketApi";

const MAX_INTENTOS_RECONEXION = 6;
const INTERVALO_PING_MS = 25000;

export const EVENTO_TEAM_CREATED = "TEAM_CREATED";
export const EVENTO_TEAM_MEMBER_JOINED = "TEAM_MEMBER_JOINED";

/**
 * Hook para mantener la conexión WebSocket con el feed del Lobby de equipos.
 * Envía un ping periódico cada 25 segundos para evitar timeouts en el servidor.
 */
export function useTeamsSocket(onTeamEvent) {
  const [conectado, setConectado] = useState(false);

  const socketRef = useRef(null);
  const intentosRef = useRef(0);
  const reintentoTimeoutRef = useRef(null);
  const pingIntervalRef = useRef(null);
  const onTeamEventRef = useRef(onTeamEvent);
  const conectarRef = useRef(() => {});

  useEffect(() => {
    onTeamEventRef.current = onTeamEvent;
  }, [onTeamEvent]);

  const limpiarPing = useCallback(() => {
    if (pingIntervalRef.current) {
      clearInterval(pingIntervalRef.current);
      pingIntervalRef.current = null;
    }
  }, []);

  const iniciarPing = useCallback(
    (socket) => {
      limpiarPing();
      pingIntervalRef.current = setInterval(() => {
        if (socket.readyState === WebSocket.OPEN) {
          try {
            socket.send("ping");
          } catch (e) {
            console.error("Error enviando ping WebSocket teams:", e);
          }
        }
      }, INTERVALO_PING_MS);
    },
    [limpiarPing]
  );

  const conectar = useCallback(() => {
    if (
      socketRef.current &&
      (socketRef.current.readyState === WebSocket.OPEN ||
        socketRef.current.readyState === WebSocket.CONNECTING)
    ) {
      return;
    }

    try {
      const socket = crearTeamsSocket();
      socketRef.current = socket;

      socket.onopen = () => {
        if (socketRef.current !== socket) return;
        setConectado(true);
        intentosRef.current = 0;
        iniciarPing(socket);
      };

      socket.onmessage = (event) => {
        if (socketRef.current !== socket) return;

        let payload;
        try {
          payload = JSON.parse(event.data);
        } catch {
          return;
        }

        if (payload?.type && payload?.data) {
          onTeamEventRef.current?.(payload);
        }
      };

      socket.onclose = () => {
        if (socketRef.current !== socket) return;

        limpiarPing();
        setConectado(false);
        socketRef.current = null;

        if (intentosRef.current < MAX_INTENTOS_RECONEXION) {
          const espera = Math.min(1000 * 2 ** intentosRef.current, 15000);
          intentosRef.current += 1;
          reintentoTimeoutRef.current = setTimeout(
            () => conectarRef.current(),
            espera
          );
        }
      };

      socket.onerror = () => {
        // onclose manejará la reconexión
      };
    } catch (e) {
      console.error("No se pudo iniciar WebSocket teams:", e);
    }
  }, [iniciarPing, limpiarPing]);

  useEffect(() => {
    conectarRef.current = conectar;
  }, [conectar]);

  useEffect(() => {
    conectarRef.current();

    return () => {
      limpiarPing();
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
      socket.onerror = null;

      if (socket.readyState === WebSocket.OPEN) {
        socket.close(1000, "Cerrando lobby feed");
      } else if (socket.readyState === WebSocket.CONNECTING) {
        socket.onopen = () => socket.close(1000, "Cerrando lobby feed");
      }

      setConectado(false);
    };
  }, [conectar, limpiarPing]);

  return conectado;
}

export default useTeamsSocket;
