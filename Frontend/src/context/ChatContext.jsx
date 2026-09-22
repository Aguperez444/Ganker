import {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useMemo,
  useRef,
  useState,
} from "react";
import { iniciarConversacion, obtenerConversaciones } from "../api/chatApi";
import { useAuth } from "./AuthContext";
import { obtenerIdUsuarioDesdeToken } from "../utils/jwt";
import { reproducirSonidoNotificacion } from "../utils/sonido";
import { useNotificacionesSocket } from "../hooks/useNotificacionesSocket";
import { useIsDesktop } from "../hooks/useIsDesktop";

const ChatContext = createContext(null);

// AppLayout y AdminLayout montan cada uno su propio ChatProvider (son
// arboles de rutas distintos), asi que "mostrar/ocultar el chat" no puede
// vivir solo en el estado de React: cambiar de panel jugador a admin (o
// viceversa) desmonta un provider y monta el otro de cero, y un refresh
// reinicia igual. Por eso esta preferencia se lee/guarda en localStorage:
// cualquier ChatProvider que se monte despues sigue mostrando lo mismo que
// el jugador dejo la ultima vez, sin importar de donde venga.
const CLAVE_CHAT_ABIERTO = "ganker_chat_abierto";
const CLAVE_PANEL_DESKTOP_VISIBLE = "ganker_chat_panel_desktop_visible";

function leerPreferenciaBooleana(clave, valorPorDefecto) {
  try {
    const guardado = localStorage.getItem(clave);
    return guardado === null ? valorPorDefecto : guardado === "true";
  } catch {
    // localStorage puede no estar disponible (modo privado, SSR, etc.).
    return valorPorDefecto;
  }
}

function guardarPreferenciaBooleana(clave, valor) {
  try {
    localStorage.setItem(clave, String(valor));
  } catch {
    // No es critico si no se pudo persistir: la sesion actual sigue
    // funcionando igual, solo no se recuerda para la proxima.
  }
}

// Logica de fetch aparte del componente (no un useCallback de
// ChatProvider) por el mismo motivo que useGames.js: llamar desde un efecto
// a una funcion memoizada del propio componente que hace setState dispara
// la regla set-state-in-effect. `cargandoRef` evita ademas que varias
// notificaciones seguidas de una conversacion todavia no conocida (ver
// actualizarUltimoMensaje mas abajo) disparen pedidos GET concurrentes: si
// ya hay uno en vuelo, los siguientes llamados no hacen nada.
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

/**
 * US 10 - Iniciar conversacion privada.
 *
 * Estado global del chat: la lista de conversaciones, cual esta activa y la
 * conexion de notificaciones en vivo (/api/v1/ws/notifications), que tiene
 * que quedar abierta mientras el jugador tenga sesion, sin importar en que
 * pantalla de la app este. Por eso vive en un Context (como AuthContext) y
 * no en un hook de pantalla: AppLayout monta el provider una sola vez para
 * toda el area autenticada.
 *
 * El chat en si (la ventana de mensajes de UNA conversacion) sigue el mismo
 * patron que el resto de la app: ese socket puntual lo abre useChatSocket
 * dentro de ChatWindowComponent, no este contexto.
 */
export function ChatProvider({ children }) {
  const { isAuthenticated, tokens } = useAuth();

  const [conversaciones, setConversaciones] = useState([]);
  const [conversacionActivaId, setConversacionActivaId] = useState(null);
  const [chatAbierto, setChatAbierto] = useState(() =>
    leerPreferenciaBooleana(CLAVE_CHAT_ABIERTO, false)
  );
  // Panel fijo de desktop (AppLayout/AdminLayout): por defecto visible (es
  // el comportamiento de siempre para quien nunca lo toco), pero el boton
  // de "Enviar mensaje" del navbar lo puede ocultar/mostrar, y esa eleccion
  // se recuerda (ver CLAVE_PANEL_DESKTOP_VISIBLE mas arriba).
  const [panelDesktopVisible, setPanelDesktopVisible] = useState(() =>
    leerPreferenciaBooleana(CLAVE_PANEL_DESKTOP_VISIBLE, true)
  );
  const [cargando, setCargando] = useState(false);
  const [error, setError] = useState(null);
  const cargandoConversacionesRef = useRef(false);

  // Misma deteccion reactiva (matchMedia) que usan AppLayout/AdminLayout
  // para elegir panel fijo vs. drawer: antes esta condicion la recalculaba
  // a mano con un window.innerWidth leido en el momento del evento, una
  // segunda fuente de verdad que podia desincronizarse de la que realmente
  // decide que se renderiza.
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

  // US 10 - Todavia no existe un endpoint de historial completo (ver
  // guia.md). Mientras tanto, guardamos ACA los mensajes que ya se vieron
  // en esta sesion del navegador, por conversacion: asi cerrar el chat y
  // volver a abrirlo no pierde lo que ya se cargo. Es un Map en un ref (no
  // state) porque solo lo lee/actualiza ChatWindowComponent al montar/recibir
  // mensajes; no hace falta re-renderizar el resto del arbol por esto.
  const mensajesPorConversacionRef = useRef(new Map());

  // Solo LEE el cache: no lo toca. `obtenerMensajesDeConversacion` vivia
  // mezclada con un cache.set() de "sembrar si no existe" y se llamaba
  // desde el cuerpo de render de ChatWindowComponent, es decir mutaba un
  // Map compartido como efecto secundario de renderizar. Ahora esa mutacion
  // vive aparte, en sembrarMensajesDeConversacion, para llamarla desde un
  // efecto (ver ChatWindowComponent).
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

  // Se ve la conversacion si el panel fijo de desktop esta visible (el
  // jugador no lo oculto con el boton de "Enviar mensaje") o, en
  // mobile/tablet, si el drawer esta abierto. Son mutuamente excluyentes
  // segun en que layout estemos: antes esto era un OR entre ambos, asi que
  // si el jugador abria una conversacion en el drawer mobile y despues
  // pasaba a desktop y ocultaba el panel fijo, `chatAbierto` (que nadie
  // resetea desde el panel fijo) seguia en true y la conversacion quedaba
  // marcada como "vista" aunque no hubiera ningun chat en pantalla.
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
          // Conversacion nueva que todavia no teniamos en la lista local.
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

  // Notificacion global (/api/v1/ws/notifications): llega para CUALQUIER
  // conversacion, este el jugador viendola o no.
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

  // Mensaje recibido por el socket de la sala activa (ChatWindowComponent).
  // A diferencia de la notificacion global, esto solo llega mientras esa
  // conversacion puntual esta abierta, asi que nunca suma no leidos: el
  // jugador la esta viendo en ese mismo momento.
  //
  // Tambien lo agregamos al cache de mensajes de la conversacion (ver
  // obtenerMensajesDeConversacion): es lo que permite que, al cerrar y
  // volver a abrir el chat dentro de la misma sesion, se seleccione con
  // toda la charla ya vista y no solo con el ultimo mensaje.
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

  // Aparte de seleccionarConversacion para que ChatWindowComponent tambien
  // pueda llamarla al montar (ver su useEffect): el panel fijo de desktop y
  // el drawer mobile desmontan el arbol del chat entero cuando se ocultan
  // (ver AppLayout/AdminLayout/ChatDrawer), asi que volver a mostrarlos con
  // una conversacion que ya estaba activa remonta ChatWindowComponent
  // directamente, sin pasar de nuevo por seleccionarConversacion. Sin este
  // llamado aparte, los no leidos que se sumaron mientras el panel estaba
  // oculto quedaban pegados hasta salir de la conversacion y volver a
  // entrar (que si pasa por seleccionarConversacion).
  const marcarConversacionComoVista = useCallback((conversationId) => {
    setConversaciones((actuales) =>
      actuales.map((c) =>
        c.conversation_id === conversationId ? { ...c, unread_count: 0 } : c
      )
    );
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

  // Boton "Enviar mensaje" del navbar: en mobile/admin abre o cierra el
  // drawer; en el panel fijo de desktop (AppLayout) lo oculta o lo vuelve a
  // mostrar. Cada layout usa el que le corresponde segun tenga o no panel
  // fijo (ver AppLayout.jsx / AdminLayout.jsx). No resetea la conversacion
  // activa: si el jugador lo vuelve a abrir, retoma donde estaba.
  const alternarChat = useCallback(() => {
    setChatAbierto((abierto) => !abierto);
  }, []);

  const alternarPanelDesktop = useCallback(() => {
    setPanelDesktopVisible((visible) => !visible);
  }, []);

  // US 10 - Iniciar conversacion privada desde la tarjeta de un jugador.
  // Idempotente: si ya existía, el backend devuelve la misma conversación.
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
