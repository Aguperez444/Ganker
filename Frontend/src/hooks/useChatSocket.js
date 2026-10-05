import { useCallback, useEffect, useRef, useState } from "react";
import { CLAVES_SESION } from "../api/axiosClient";
import { crearChatSocket, crearChatroomSocket } from "../api/chatSocketApi";

const MAX_INTENTOS_RECONEXION = 5;

const TIPO_MENSAJES_LEIDOS = "MESSAGES_READ_NOTIFICATION";

export function useChatSocket(
  conversationId,
  mensajesIniciales = [],
  onMensaje,
  isChatroom = false
) {
  const [mensajes, setMensajes] = useState(mensajesIniciales);
  const [estado, setEstado] = useState("CERRADO");
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

    const socket = isChatroom
      ? crearChatroomSocket(conversationId, token)
      : crearChatSocket(conversationId, token);

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

      if (data.error) {
        setError(data.error);
        return;
      }

      if (data.type === TIPO_MENSAJES_LEIDOS) {
        setMensajes((actuales) =>
          actuales.map((mensaje) =>
            mensaje.sender_id !== data.read_by
              ? { ...mensaje, is_read: true }
              : mensaje
          )
        );

        return;
      }

      setMensajes((actuales) => {
        if (
          data.message_id &&
          actuales.some((mensaje) => mensaje.message_id === data.message_id)
        ) {
          return actuales;
        }

        return [...actuales, data];
      });

      onMensajeRef.current?.(data);
    };

    socket.onerror = () => {
      if (socketRef.current === socket) {
        setEstado("ERROR");
      }
    };

    socket.onclose = (event) => {
      if (socketRef.current !== socket) return;

      setEstado("CERRADO");
      socketRef.current = null;

      if (event.code === 1008) {
        setError(
          event.reason ||
            (isChatroom
              ? "No tienes acceso a este chatroom de equipo."
              : "No tenés acceso a esta conversación.")
        );
        return;
      }

      if (intentosRef.current < MAX_INTENTOS_RECONEXION) {
        const espera = Math.min(1000 * 2 ** intentosRef.current, 10000);

        intentosRef.current += 1;

        reintentoTimeoutRef.current = setTimeout(
          () => conectarRef.current(),
          espera
        );

        return;
      }

      setError("Se perdió la conexión con el chat.");
    };
  }, [conversationId, isChatroom]);

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

      if (!socket) return;

      socketRef.current = null;
      socket.onmessage = null;
      socket.onerror = null;
      socket.onclose = null;

      if (socket.readyState === WebSocket.OPEN) {
        socket.close(1000, "Chat cerrado");
      } else if (socket.readyState === WebSocket.CONNECTING) {
        socket.onopen = () => socket.close(1000, "Chat cerrado");
      }
    };
  }, [conectar]);

  const enviarMensaje = useCallback((contenido) => {
    const texto = contenido.trim();

    if (!texto) {
      return false;
    }

    if (!socketRef.current || socketRef.current.readyState !== WebSocket.OPEN) {
      setError("No se pudo enviar el mensaje: no hay conexión con el chat.");

      return false;
    }

    if (texto.length > 2000) {
      setError("El mensaje no puede superar los 2000 caracteres.");
      return false;
    }

    socketRef.current.send(
      JSON.stringify({
        content: texto,
      })
    );

    return true;
  }, []);

  return {
    mensajes,
    setMensajes,
    estado,
    error,
    enviarMensaje,
  };
}

export default useChatSocket;
