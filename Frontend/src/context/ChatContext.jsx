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
  obtenerChatrooms,
  marcarChatroomComoLeido,
} from "../api/chatApi";
import { useAuth } from "./AuthContext";
import { obtenerIdUsuarioDesdeToken } from "../utils/jwt";
import { reproducirSonidoNotificacion } from "../utils/sonido";
import { useNotificacionesSocket } from "../hooks/useNotificacionesSocket";
import { useIsDesktop } from "../hooks/useIsDesktop";
import { logError } from "../utils/logs";

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

// US 44/45 - Los chats privados y los chatrooms de equipo se muestran en la
// misma lista. Cada uno se marca con `tipo` ("privada" | "equipo") y el
// chatroom se adapta a la forma de una conversacion (conversation_id): los
// ids no chocan porque el backend usa la misma tabla para ambos.
function chatroomComoConversacion(chatroom) {
  return {
    tipo: "equipo",
    conversation_id: chatroom.chatroom_id,
    team_id: chatroom.team_id,
    nombre: chatroom.name,
    icon_url: chatroom.icon_url,
    member_count: chatroom.member_count,
    last_message: chatroom.last_message,
    unread_count: chatroom.unread_count,
  };
}

function ordenarPorUltimoMensaje(conversaciones) {
  const fecha = (c) =>
    c.last_message?.timestamp
      ? new Date(c.last_message.timestamp).getTime()
      : 0;
  return [...conversaciones].sort((a, b) => fecha(b) - fecha(a));
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
    // Si falla una de las dos listas se muestra la otra: el chat privado no
    // tiene por que dejar de andar porque no cargaron los de equipo.
    const [privadas, chatrooms] = await Promise.allSettled([
      obtenerConversaciones(),
      obtenerChatrooms(),
    ]);

    if (privadas.status === "rejected" && chatrooms.status === "rejected") {
      throw privadas.reason;
    }

    const lista = [
      ...(privadas.status === "fulfilled" ? (privadas.value ?? []) : []).map(
        (c) => ({ ...c, tipo: "privada" })
      ),
      ...(chatrooms.status === "fulfilled" ? (chatrooms.value ?? []) : []).map(
        chatroomComoConversacion
      ),
    ];
    setConversaciones(ordenarPorUltimoMensaje(lista));

    const fallo = privadas.status === "rejected" ? privadas : chatrooms;
    if (fallo.status === "rejected") {
      logError("Error al cargar parte de las conversaciones:", fallo.reason);
      setError(
        privadas.status === "rejected"
          ? "No se pudieron cargar las conversaciones privadas."
          : "No se pudieron cargar los chats de equipo."
      );
    }
  } catch (err) {
    logError("Error al cargar conversaciones:", err);
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

  const conversacionesRef = useRef([]);
  const esDesktop = useIsDesktop();

  useEffect(() => {
    conversacionesRef.current = conversaciones;
  }, [conversaciones]);

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
      const existe = conversacionesRef.current.some(
        (c) => c.conversation_id === conversationId
      );

      if (!existe) {
        cargarConversaciones();
        return;
      }

      setConversaciones((actuales) => {
        const indice = actuales.findIndex(
          (c) => c.conversation_id === conversationId
        );

        if (indice === -1) {
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
        // Si no se esta viendo, su ChatWindowComponent no esta montado y el
        // mensaje no entro al cache: se descarta para que al abrirla se
        // vuelva a pedir el historial en vez de mostrar uno desactualizado.
        mensajesPorConversacionRef.current.delete(notificacion.conversation_id);
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

  // Pantallas suscriptas a los cambios del equipo (ver useEventosEquipo).
  const suscriptoresEquipoRef = useRef(new Set());

  const suscribirEventosEquipo = useCallback((callback) => {
    suscriptoresEquipoRef.current.add(callback);
    return () => suscriptoresEquipoRef.current.delete(callback);
  }, []);

  // Al unirse, salir, ser expulsado o disolverse el equipo cambia tambien la
  // lista de chats (aparece o desaparece el del equipo): se recarga aca.
  const manejarEventoEquipo = useCallback(
    (evento) => {
      cargarConversaciones();
      suscriptoresEquipoRef.current.forEach((callback) => callback(evento));
    },
    [cargarConversaciones]
  );

  useNotificacionesSocket(
    isAuthenticated ? token : null,
    manejarNotificacion,
    manejarEventoEquipo
  );

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
    // como no leidos. Los chatrooms de equipo tienen su propio endpoint.
    // Si todavia no esta en la lista (ej. recien unido a un equipo) no se
    // sabe a que endpoint ir: ChatWindowComponent la vuelve a marcar al
    // montarse, cuando la lista ya se recargo.
    const conversacion = conversacionesRef.current.find(
      (c) => c.conversation_id === conversationId
    );
    if (!conversacion) return;
    const marcar =
      conversacion.tipo === "equipo"
        ? marcarChatroomComoLeido
        : marcarConversacionComoLeida;
    marcar(conversationId).catch((err) => {
      logError("Error al marcar la conversación como leída:", err);
    });
  }, []);

  const seleccionarConversacion = useCallback(
    (conversationId) => {
      setConversacionActivaId(conversationId);
      // Hay que abrir los dos flags (no solo el que aplica segun esDesktop
      // en este momento): si el usuario habia cerrado el panel/drawer, la
      // conversacion quedaba "activa" pero invisible (ver estaViendo mas
      // arriba), como si no hubiera pasado nada.
      setChatAbierto(true);
      setPanelDesktopVisible(true);
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
    suscribirEventosEquipo,
    manejarMensajeDeSalaActiva,
    obtenerMensajesDeConversacion,
    sembrarMensajesDeConversacion,
    actualizarMensajesDeConversacion,
  };

  return <ChatContext.Provider value={value}>{children}</ChatContext.Provider>;
}

// Ejecuta `callback(evento)` cada vez que el backend avisa un cambio en el
// equipo del jugador (ej. TEAM_NEW_MEMBER_NOTIFICATION). Fuera de un
// ChatProvider no hace nada, asi los hooks y paginas que la usan se pueden
// testear sin montar el chat.
export function useEventosEquipo(callback) {
  const context = useContext(ChatContext);
  const callbackRef = useRef(callback);

  useEffect(() => {
    callbackRef.current = callback;
  }, [callback]);

  const suscribir = context?.suscribirEventosEquipo;

  useEffect(() => {
    if (!suscribir) return undefined;
    return suscribir((evento) => callbackRef.current?.(evento));
  }, [suscribir]);
}

export function useChat() {
  const context = useContext(ChatContext);
  if (!context) {
    throw new Error("useChat debe ser usado dentro de un ChatProvider");
  }
  return context;
}
