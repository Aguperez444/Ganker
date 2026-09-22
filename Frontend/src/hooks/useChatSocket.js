import { useCallback, useEffect, useRef, useState } from "react";
import { CLAVES_SESION } from "../api/axiosClient";
import { urlWebSocket } from "../utils/websocket";

const MAX_INTENTOS_RECONEXION = 5;

// Por este socket llegan mensajes nuevos y avisos de lectura mezclados;
// esto distingue el segundo caso (ver notification_type_enum.py backend).
const TIPO_MENSAJES_LEIDOS = "MESSAGES_READ_NOTIFICATION";

export function useChatSocket(
  conversationId,
  mensajesIniciales = [],
  onMensaje
) {
  const [mensajes, setMensajes] = useState(mensajesIniciales);
  const [estado, setEstado] = useState("CERRADO"); // CONECTANDO | ABIERTO | CERRADO | ERROR
  const [error, setError] = useState(null);

  const socketRef = useRef(null);
  const intentosRef = useRef(0);
  const reintentoTimeoutRef = useRef(null);
  const conectarRef = useRef(() => {});
  const onMensajeRef = useRef(onMensaje);

  useEffect(() => {
    onMensajeRef.current = onMensaje;
  }, [onMensaje]);

  const conectar = useCallback(() => {
    if (!conversationId) return;

    const token = localStorage.getItem(CLAVES_SESION.access);
    if (!token) {
      setEstado("ERROR");
      setError("No hay una sesión activa.");
      return;
    }

    if (
      socketRef.current &&
      (socketRef.current.readyState === WebSocket.OPEN ||
        socketRef.current.readyState === WebSocket.CONNECTING)
    ) {
      return;
    }

    setEstado("CONECTANDO");
    setError(null);

    const socket = new WebSocket(
      urlWebSocket(
        `/api/v1/ws/chat/conversations/${conversationId}?token=${encodeURIComponent(token)}`
      )
    );
    socketRef.current = socket;

    socket.onopen = () => {
      if (socketRef.current !== socket) return;
      setEstado("ABIERTO");
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

      // Mensaje invalido: el backend lo rechaza pero deja el socket abierto.
      if (data.error) {
        setError(data.error);
        return;
      }

      // El otro participante leyo mis mensajes: no es un mensaje nuevo,
      // solo actualiza is_read en los que ya estan en pantalla.
      if (data.type === TIPO_MENSAJES_LEIDOS) {
        setMensajes((actuales) =>
          actuales.map((m) =>
            m.sender_id !== data.read_by ? { ...m, is_read: true } : m
          )
        );
        return;
      }

      setMensajes((actuales) => {
        if (
          data.message_id &&
          actuales.some((m) => m.message_id === data.message_id)
        ) {
          return actuales;
        }
        return [...actuales, data];
      });

      onMensajeRef.current?.(data);
    };

    socket.onerror = () => {
      if (socketRef.current === socket) setEstado("ERROR");
    };

    socket.onclose = (event) => {
      if (socketRef.current !== socket) return;

      setEstado("CERRADO");
      socketRef.current = null;

      // 1008 = Policy Violation: sin permiso sobre esta conversacion o token
      // invalido/vencido. Reintentar no va a arreglar nada.
      if (event.code === 1008) {
        setError(event.reason || "No tenés acceso a esta conversación.");
        return;
      }

      if (intentosRef.current < MAX_INTENTOS_RECONEXION) {
        const espera = Math.min(1000 * 2 ** intentosRef.current, 10000);
        intentosRef.current += 1;
        reintentoTimeoutRef.current = setTimeout(
          () => conectarRef.current(),
          espera
        );
      } else {
        setError("Se perdió la conexión con el chat.");
      }
    };
  }, [conversationId]);

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
        socket.onerror = null;
        socket.onclose = null;

        if (socket.readyState === WebSocket.OPEN) {
          socket.close(1000, "Chat cerrado");
        } else if (socket.readyState === WebSocket.CONNECTING) {
          // Cerrar un socket que todavia esta conectando dispara en la
          // consola "WebSocket is closed before the connection is
          // established". Difiriendo el cierre a onopen evitamos ese ruido.
          socket.onopen = () => socket.close(1000, "Chat cerrado");
        }
      }
      setEstado("CERRADO");
    };
  }, [conectar]);

  const enviarMensaje = useCallback((contenido) => {
    const texto = contenido.trim();
    if (!texto) return false;

    if (!socketRef.current || socketRef.current.readyState !== WebSocket.OPEN) {
      setError("No se pudo enviar el mensaje: no hay conexión con el chat.");
      return false;
    }

    if (texto.length > 2000) {
      setError("El mensaje no puede superar los 2000 caracteres.");
      return false;
    }

    socketRef.current.send(JSON.stringify({ content: texto }));
    return true;
  }, []);

  return { mensajes, setMensajes, estado, error, enviarMensaje };
}

export default useChatSocket;
