import {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useMemo,
  useRef,
  useState,
} from "react";
import {
  iniciarConversacion,
  obtenerConversaciones,
  marcarConversacionComoLeida,
} from "../api/chatApi";
import { useAuth } from "./AuthContext";
import { obtenerIdUsuarioDesdeToken } from "../utils/jwt";
import { reproducirSonidoNotificacion } from "../utils/sonido";
import { useNotificacionesSocket } from "../hooks/useNotificacionesSocket";
import { useIsDesktop } from "../hooks/useIsDesktop";

const ChatContext = createContext(null);

// AppLayout y AdminLayout montan cada uno su propio ChatProvider, asi que
// esta preferencia se guarda en localStorage para sobrevivir el remount.
const CLAVE_CHAT_ABIERTO = "ganker_chat_abierto";
const CLAVE_PANEL_DESKTOP_VISIBLE = "ganker_chat_panel_desktop_visible";

function leerPreferenciaBooleana(clave, valorPorDefecto) {
  try {
    const guardado = localStorage.getItem(clave);
    return guardado === null ? valorPorDefecto : guardado === "true";
  } catch {
    return valorPorDefecto;
  }
}

function guardarPreferenciaBooleana(clave, valor) {
  try {
    localStorage.setItem(clave, String(valor));
  } catch {
    // No es critico: solo se pierde la preferencia, no la sesion.
  }
}

// `cargandoRef` evita pedidos GET concurrentes si ya hay uno en vuelo.
async function cargarYSetearConversaciones({
  isAuthenticated,
  setConversaciones,
  setCargando,
  setError,
  cargandoRef,
}) {
  if (!isAuthenticated) {
    setConversaciones([]);
    return;
  }

  if (cargandoRef.current) return;
  cargandoRef.current = true;

  setCargando(true);
  setError(null);
  try {
    const lista = await obtenerConversaciones();
    setConversaciones(lista ?? []);
  } catch (err) {
    console.error("Error al cargar conversaciones:", err);
    setError("No se pudieron cargar las conversaciones.");
  } finally {
    setCargando(false);
    cargandoRef.current = false;
  }
}

// Estado global del chat: conversaciones, cual esta activa, y la conexion
// de notificaciones en vivo. El socket de UNA conversacion puntual lo abre
// useChatSocket dentro de ChatWindowComponent, no este contexto.
export function ChatProvider({ children }) {
  const { isAuthenticated, tokens } = useAuth();

  const [conversaciones, setConversaciones] = useState([]);
  const [conversacionActivaId, setConversacionActivaId] = useState(null);
  const [chatAbierto, setChatAbierto] = useState(() =>
    leerPreferenciaBooleana(CLAVE_CHAT_ABIERTO, false)
  );
  const [panelDesktopVisible, setPanelDesktopVisible] = useState(() =>
    leerPreferenciaBooleana(CLAVE_PANEL_DESKTOP_VISIBLE, true)
  );
  const [cargando, setCargando] = useState(false);
  const [error, setError] = useState(null);
  const cargandoConversacionesRef = useRef(false);

  const esDesktop = useIsDesktop();

  useEffect(() => {
    guardarPreferenciaBooleana(CLAVE_CHAT_ABIERTO, chatAbierto);
  }, [chatAbierto]);

  useEffect(() => {
    guardarPreferenciaBooleana(
      CLAVE_PANEL_DESKTOP_VISIBLE,
      panelDesktopVisible
    );
  }, [panelDesktopVisible]);

  const token = tokens?.access_token ?? null;
  const currentUserId = useMemo(
    () => obtenerIdUsuarioDesdeToken(token),
    [token]
  );

  // Cache de mensajes ya vistos por conversacion, para no perderlos al
  // cerrar y reabrir el chat en la misma sesion. Ref (no state): solo lo
  // lee/actualiza ChatWindowComponent, no hace falta re-renderizar por esto.
  const mensajesPorConversacionRef = useRef(new Map());

  // Solo LEE el cache; sembrarMensajesDeConversacion es quien lo mutua.
  const obtenerMensajesDeConversacion = useCallback((conversationId) => {
    return mensajesPorConversacionRef.current.get(conversationId);
  }, []);

  const sembrarMensajesDeConversacion = useCallback(
    (conversationId, semilla) => {
      const cache = mensajesPorConversacionRef.current;
      if (!cache.has(conversationId)) {
        cache.set(conversationId, semilla ?? []);
      }
    },
    []
  );

  // A diferencia de sembrarMensajesDeConversacion, esta SIEMPRE reemplaza
  // la entrada (hace falta para prependear mensajes viejos ya cargados).
  const actualizarMensajesDeConversacion = useCallback(
    (conversationId, mensajes) => {
      mensajesPorConversacionRef.current.set(conversationId, mensajes);
    },
    []
  );

  const cargarConversaciones = useCallback(
    () =>
      cargarYSetearConversaciones({
        isAuthenticated,
        setConversaciones,
        setCargando,
        setError,
        cargandoRef: cargandoConversacionesRef,
      }),
    [isAuthenticated]
  );

  useEffect(() => {
    cargarConversaciones();
  }, [cargarConversaciones]);

  // Se ve la conversacion si el panel fijo de desktop esta visible, o en
  // mobile/tablet si el drawer esta abierto (mutuamente excluyentes).
  const estaViendo = useCallback(
    (conversationId) => {
      const chatVisible = esDesktop ? panelDesktopVisible : chatAbierto;
      return chatVisible && conversacionActivaId === conversationId;
    },
    [esDesktop, chatAbierto, panelDesktopVisible, conversacionActivaId]
  );

  // Mueve la conversacion al principio de la lista y actualiza su ultimo
  // mensaje. La llaman tanto la notificacion global como el socket de la
  // sala activa, asi que queda centralizado aca en vez de duplicarse.
  const actualizarUltimoMensaje = useCallback(
    (conversationId, ultimoMensaje, { esVista }) => {
      setConversaciones((actuales) => {
        const indice = actuales.findIndex(
          (c) => c.conversation_id === conversationId
        );

        if (indice === -1) {
          cargarConversaciones();
          return actuales;
        }

        const conversacion = actuales[indice];
        const actualizada = {
          ...conversacion,
          last_message: ultimoMensaje,
          unread_count: esVista ? 0 : (conversacion.unread_count ?? 0) + 1,
        };

        const resto = [...actuales];
        resto.splice(indice, 1);
        return [actualizada, ...resto];
      });
    },
    [cargarConversaciones]
  );

  // Notificacion global: llega para cualquier conversacion, la este viendo o no.
  const manejarNotificacion = useCallback(
    (notificacion) => {
      const esVista = estaViendo(notificacion.conversation_id);

      if (!esVista) {
        reproducirSonidoNotificacion();
      }

      actualizarUltimoMensaje(
        notificacion.conversation_id,
        {
          content: notificacion.content,
          timestamp: notificacion.timestamp,
          sender_id: notificacion.sender_id,
        },
        { esVista }
      );
    },
    [estaViendo, actualizarUltimoMensaje]
  );

  useNotificacionesSocket(isAuthenticated ? token : null, manejarNotificacion);

  // Mensaje de la sala activa: a diferencia de la notificacion global, solo
  // llega mientras esa conversacion esta abierta, asi que nunca suma no leidos.
  const manejarMensajeDeSalaActiva = useCallback(
    (conversationId, mensaje) => {
      const cache = mensajesPorConversacionRef.current;
      const actuales = cache.get(conversationId) ?? [];
      const yaEstaba =
        mensaje.message_id &&
        actuales.some((m) => m.message_id === mensaje.message_id);

      if (!yaEstaba) {
        cache.set(conversationId, [...actuales, mensaje]);
      }

      actualizarUltimoMensaje(
        conversationId,
        {
          content: mensaje.content,
          timestamp: mensaje.timestamp,
          sender_id: mensaje.sender_id,
        },
        { esVista: true }
      );
    },
    [actualizarUltimoMensaje]
  );

  // Separada de seleccionarConversacion para que ChatWindowComponent
  // tambien la llame al montar (reabrir un panel/drawer con la conversacion
  // ya activa no pasa por seleccionarConversacion).
  const marcarConversacionComoVista = useCallback((conversationId) => {
    setConversaciones((actuales) =>
      actuales.map((c) =>
        c.conversation_id === conversationId ? { ...c, unread_count: 0 } : c
      )
    );

    // Fire and forget: si no avisamos al backend, is_read queda en false
    // en la base y un refresh de pagina vuelve a mostrar estos mensajes
    // como no leidos.
    marcarConversacionComoLeida(conversationId).catch((err) => {
      console.error("Error al marcar la conversación como leída:", err);
    });
  }, []);

  const seleccionarConversacion = useCallback(
    (conversationId) => {
      setConversacionActivaId(conversationId);
      setChatAbierto(true);
      marcarConversacionComoVista(conversationId);
    },
    [marcarConversacionComoVista]
  );

  const cerrarConversacionActiva = useCallback(() => {
    setConversacionActivaId(null);
  }, []);

  const abrirChat = useCallback(() => setChatAbierto(true), []);

  const cerrarChat = useCallback(() => {
    setChatAbierto(false);
    setConversacionActivaId(null);
  }, []);

  // Boton "Enviar mensaje" del navbar: abre/cierra el drawer en mobile, o
  // el panel fijo en desktop segun el layout.
  const alternarChat = useCallback(() => {
    setChatAbierto((abierto) => !abierto);
  }, []);

  const alternarPanelDesktop = useCallback(() => {
    setPanelDesktopVisible((visible) => !visible);
  }, []);

  const iniciarChat = useCallback(
    async (targetUserId) => {
      setError(null);

      if (currentUserId && targetUserId === currentUserId) {
        const mensaje = "No podés iniciar una conversación con vos mismo.";
        setError(mensaje);
        return { exito: false, error: mensaje };
      }

      try {
        const { conversation_id: conversationId } =
          await iniciarConversacion(targetUserId);

        await cargarConversaciones();
        seleccionarConversacion(conversationId);

        return { exito: true, conversationId };
      } catch (err) {
        const status = err.response?.status;
        let mensaje;

        if (status === 404) {
          mensaje = "Ese jugador ya no existe.";
        } else if (status === 401) {
          mensaje = "Tu sesión no es válida o ha expirado.";
        } else if (status === 403) {
          mensaje = "No tenés permisos para iniciar una conversación.";
        } else if (!err.response) {
          mensaje = "No pudimos conectar con el servidor. Probá de nuevo.";
        } else {
          mensaje =
            err.response?.data?.error ??
            "No se pudo iniciar la conversación. Probá de nuevo.";
        }

        setError(mensaje);
        return { exito: false, error: mensaje };
      }
    },
    [currentUserId, cargarConversaciones, seleccionarConversacion]
  );

  const totalNoLeidos = useMemo(
    () => conversaciones.reduce((acc, c) => acc + (c.unread_count ?? 0), 0),
    [conversaciones]
  );

  const conversacionActiva = useMemo(
    () =>
      conversaciones.find((c) => c.conversation_id === conversacionActivaId) ??
      null,
    [conversaciones, conversacionActivaId]
  );

  const value = {
    conversaciones: isAuthenticated ? conversaciones : [],
    conversacionActiva: isAuthenticated ? conversacionActiva : null,
    conversacionActivaId: isAuthenticated ? conversacionActivaId : null,
    cargando,
    error,
    chatAbierto: isAuthenticated && chatAbierto,
    panelDesktopVisible: isAuthenticated && panelDesktopVisible,
    totalNoLeidos,
    currentUserId,
    token,
    cargarConversaciones,
    seleccionarConversacion,
    marcarConversacionComoVista,
    cerrarConversacionActiva,
    abrirChat,
    cerrarChat,
    alternarChat,
    alternarPanelDesktop,
    iniciarChat,
    manejarMensajeDeSalaActiva,
    obtenerMensajesDeConversacion,
    sembrarMensajesDeConversacion,
    actualizarMensajesDeConversacion,
  };

  return <ChatContext.Provider value={value}>{children}</ChatContext.Provider>;
}

export function useChat() {
  const context = useContext(ChatContext);
  if (!context) {
    throw new Error("useChat debe ser usado dentro de un ChatProvider");
  }
  return context;
}
