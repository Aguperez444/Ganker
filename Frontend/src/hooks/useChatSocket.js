import { useCallback, useEffect, useRef, useState } from "react";
import { CLAVES_SESION } from "../api/axiosClient";
import { urlWebSocket } from "../utils/websocket";

const MAX_INTENTOS_RECONEXION = 5;

/**
 * US 10 - Interfaz de chat en tiempo real.
 *
 * Maneja la conexion websocket de UNA conversacion puntual
 * (/api/v1/ws/chat/conversations/{id}). Sigue el mismo criterio que el resto
 * de los hooks del proyecto: guarda su propio estado y no le habla a axios
 * directamente (aca ni siquiera aplica, es un socket nativo del navegador),
 * pero el componente que lo usa solo recibe datos y funciones.
 *
 * El token se lee de localStorage en cada intento de conexion (misma fuente
 * que usa el interceptor de axiosClient) en vez de recibirlo por parametro
 * ya resuelto, para no reconectar con un access_token viejo si el usuario
 * tuvo un refresh silencioso mientras el componente seguia montado.
 *
 * `mensajesIniciales` sirve para precargar el ultimo mensaje conocido de la
 * conversacion (lo que ya devuelve GET /api/v1/chat/conversations). Todavia
 * no existe un endpoint de historial completo (ver guia.md, seccion
 * "Proximos pasos"); cuando exista, alcanza con pasarle la lista completa.
 *
 * El componente que llama a este hook (ChatWindowComponent) se monta de
 * nuevo cada vez que el jugador abre una conversacion distinta (queda
 * "keyeado" por conversationId en ChatSidebarComponent), asi que
 * `mensajesIniciales` solo se usa como valor inicial.
 */
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

  return { mensajes, estado, error, enviarMensaje };
}

export default useChatSocket;
