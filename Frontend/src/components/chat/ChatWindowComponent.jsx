import { useEffect, useMemo, useRef, useState } from "react";
import AvatarUsuarioComponent from "../common/AvatarUsuarioComponent";
import IconoChicoComponent from "../common/IconoChicoComponent";
import { useChatSocket } from "../../hooks/useChatSocket";
import { useChatHistory } from "../../hooks/useChatHistory";
import { useChat } from "../../context/ChatContext";
import MessageBubbleComponent from "./MessageBubbleComponent";
import MessageInputComponent from "./MessageInputComponent";
import { logError } from "../../utils/logs";

const TEXTO_ESTADO = {
  CONECTANDO: "Conectando...",
  ABIERTO: "En línea",
  CERRADO: "Desconectado",
  ERROR: "Error de conexión",
};

const TAMANO_PAGINA_HISTORIAL = 50;

function mismoMinuto(a, b) {
  if (!a || !b) return false;

  const fechaA = new Date(a);
  const fechaB = new Date(b);

  if (Number.isNaN(fechaA.getTime()) || Number.isNaN(fechaB.getTime())) {
    return false;
  }

  return (
    fechaA.getFullYear() === fechaB.getFullYear() &&
    fechaA.getMonth() === fechaB.getMonth() &&
    fechaA.getDate() === fechaB.getDate() &&
    fechaA.getHours() === fechaB.getHours() &&
    fechaA.getMinutes() === fechaB.getMinutes()
  );
}

// US 45 - El backend responde 403 si el jugador no es integrante del chat
// (o del equipo) y 404 si el chat no existe: se explica cada caso en vez de
// un error generico.
function mensajeDeErrorHistorial(error, esDeEquipo) {
  const status = error?.response?.status;
  if (status === 403) {
    return esDeEquipo
      ? "No sos integrante de este equipo: no podés ver su historial."
      : "No tenés acceso a esta conversación.";
  }
  if (status === 404) {
    return esDeEquipo
      ? "El chat de este equipo no existe."
      : "La conversación no existe.";
  }
  return "No se pudo cargar el historial de mensajes.";
}

// Este componente prepara el historial inicial antes de montar
// ChatWindowInterna.
//
// La llamada HTTP ya no se hace directamente desde el componente:
// useChatHistory se ocupa de la comunicación con la capa api.
const ChatWindowComponent = ({
  conversacion,
  currentUserId,
  onVolver,
  onCerrar,
  onMensaje,
}) => {
  const { obtenerMensajesDeConversacion, sembrarMensajesDeConversacion } =
    useChat();

  const { cargarPaginaHistorial } = useChatHistory(
    conversacion.conversation_id,
    conversacion.tipo
  );

  // Si ya abrimos esta conversación durante la sesión,
  // reutilizamos los mensajes guardados en el cache del ChatContext.
  const mensajesCacheados = obtenerMensajesDeConversacion(
    conversacion.conversation_id
  );

  const [mensajesDelFetch, setMensajesDelFetch] = useState(null);
  const [errorHistorial, setErrorHistorial] = useState(null);

  useEffect(() => {
    if (mensajesCacheados) return;

    let cancelado = false;

    cargarPaginaHistorial({
      page: 1,
      size: TAMANO_PAGINA_HISTORIAL,
    })
      .then((mensajes) => {
        if (cancelado) return;

        sembrarMensajesDeConversacion(conversacion.conversation_id, mensajes);

        setMensajesDelFetch(mensajes);
      })
      .catch((error) => {
        if (cancelado) return;

        logError("Error al cargar el historial de mensajes:", error);

        setErrorHistorial(
          mensajeDeErrorHistorial(error, conversacion.tipo === "equipo")
        );

        setMensajesDelFetch([]);
      });

    return () => {
      cancelado = true;
    };
  }, [
    conversacion.conversation_id,
    mensajesCacheados,
    cargarPaginaHistorial,
    sembrarMensajesDeConversacion,
  ]);

  const mensajesIniciales = mensajesCacheados ?? mensajesDelFetch;

  if (mensajesIniciales === null) {
    return (
      <div className="flex h-full min-h-0 flex-col items-center justify-center bg-ganker-bg">
        <p className="text-sm text-ganker-muted">Cargando mensajes...</p>
      </div>
    );
  }

  return (
    <ChatWindowInterna
      conversacion={conversacion}
      currentUserId={currentUserId}
      onVolver={onVolver}
      onCerrar={onCerrar}
      onMensaje={onMensaje}
      mensajesIniciales={mensajesIniciales}
      errorHistorial={errorHistorial}
    />
  );
};

const ChatWindowInterna = ({
  conversacion,
  currentUserId,
  onVolver,
  onCerrar,
  onMensaje,
  mensajesIniciales,
  errorHistorial,
}) => {
  const { actualizarMensajesDeConversacion, marcarConversacionComoVista } =
    useChat();

  const { cargarPaginaHistorial } = useChatHistory(
    conversacion.conversation_id,
    conversacion.tipo
  );

  const mensajesRef = useRef(null);

  const [cargandoAnteriores, setCargandoAnteriores] = useState(false);

  const [errorAnteriores, setErrorAnteriores] = useState(null);

  const [hayMasAnteriores, setHayMasAnteriores] = useState(
    mensajesIniciales.length >= TAMANO_PAGINA_HISTORIAL
  );

  const paginaRef = useRef(1);

  const restaurarScrollRef = useRef(null);

  // US 44 - Chatroom del equipo: en vez del otro jugador se muestra el
  // equipo, y en cada mensaje ajeno quien lo escribio.
  const esDeEquipo = conversacion.tipo === "equipo";

  const otroParticipante = conversacion.other_participant;

  const nombreOtro = esDeEquipo
    ? conversacion.nombre || "Chat del equipo"
    : otroParticipante?.name || otroParticipante?.username || "Jugador";

  // Si se reabre el panel/drawer con la conversación ya activa,
  // volvemos a marcarla como vista.
  useEffect(() => {
    marcarConversacionComoVista(conversacion.conversation_id);
  }, [conversacion.conversation_id, marcarConversacionComoVista]);

  const { mensajes, setMensajes, estado, error, enviarMensaje } = useChatSocket(
    conversacion.conversation_id,
    mensajesIniciales,
    (mensaje) => onMensaje?.(conversacion.conversation_id, mensaje),
    conversacion.tipo
  );

  // Solo mostramos el indicador de leído en el último mensaje propio.
  const indiceUltimoMensajePropio = useMemo(() => {
    for (let indice = mensajes.length - 1; indice >= 0; indice--) {
      if (mensajes[indice].sender_id === currentUserId) {
        return indice;
      }
    }

    return -1;
  }, [mensajes, currentUserId]);

  // Mantiene actualizado el cache global de mensajes de ChatContext.
  useEffect(() => {
    actualizarMensajesDeConversacion(conversacion.conversation_id, mensajes);
  }, [
    conversacion.conversation_id,
    mensajes,
    actualizarMensajesDeConversacion,
  ]);

  const cargarMensajesAnteriores = async () => {
    if (cargandoAnteriores || !hayMasAnteriores) {
      return;
    }

    setCargandoAnteriores(true);
    setErrorAnteriores(null);

    const siguientePagina = paginaRef.current + 1;

    try {
      const mensajesAnteriores = await cargarPaginaHistorial({
        page: siguientePagina,
        size: TAMANO_PAGINA_HISTORIAL,
      });

      paginaRef.current = siguientePagina;

      setHayMasAnteriores(mensajesAnteriores.length >= TAMANO_PAGINA_HISTORIAL);

      if (mensajesAnteriores.length > 0) {
        const contenedor = mensajesRef.current;

        restaurarScrollRef.current = contenedor
          ? {
              alturaPrevia: contenedor.scrollHeight,
              scrollPrevio: contenedor.scrollTop,
            }
          : null;

        setMensajes((actuales) => {
          const idsExistentes = new Set(
            actuales
              .map((mensaje) => mensaje.message_id)
              .filter((id) => id != null)
          );

          const nuevos = mensajesAnteriores.filter(
            (mensaje) => !idsExistentes.has(mensaje.message_id)
          );

          return [...nuevos, ...actuales];
        });
      }
    } catch (error) {
      logError("Error al cargar mensajes anteriores:", error);

      setErrorAnteriores("No se pudieron cargar mensajes anteriores.");
    } finally {
      setCargandoAnteriores(false);
    }
  };

  // Mantiene la posición de scroll cuando se cargan
  // mensajes anteriores.
  //
  // Si llega un mensaje nuevo, hace scroll hasta el final.
  useEffect(() => {
    const contenedor = mensajesRef.current;

    if (!contenedor) return;

    if (restaurarScrollRef.current) {
      const { alturaPrevia, scrollPrevio } = restaurarScrollRef.current;

      restaurarScrollRef.current = null;

      contenedor.scrollTop =
        contenedor.scrollHeight - alturaPrevia + scrollPrevio;

      return;
    }

    contenedor.scrollTop = contenedor.scrollHeight;
  }, [mensajes]);

  const conectado = estado === "ABIERTO";

  return (
    <div className="flex h-full min-h-0 flex-col bg-ganker-bg">
      <header className="flex h-17 items-center gap-2.5 border-b border-white/10 bg-ganker-surface px-4">
        {onVolver && (
          <button
            type="button"
            onClick={onVolver}
            aria-label="Volver a conversaciones"
            className="flex h-8 w-8 shrink-0 items-center justify-center rounded-lg text-ganker-muted transition hover:bg-ganker-surface-light hover:text-ganker-text"
          >
            ←
          </button>
        )}

        <div className="flex h-9 w-9 shrink-0 items-center justify-center overflow-hidden rounded-full border border-ganker-purple/40 bg-ganker-surface-light text-sm font-semibold text-ganker-text">
          {esDeEquipo ? (
            <IconoChicoComponent
              src={conversacion.icon_url}
              className="h-full w-full"
            />
          ) : (
            <AvatarUsuarioComponent user={otroParticipante} alt={nombreOtro} />
          )}
        </div>

        <div className="min-w-0 flex-1">
          <h3 className="truncate font-heading text-sm font-semibold text-ganker-text">
            {nombreOtro}
          </h3>

          <span className="text-[11px] text-ganker-muted">
            {esDeEquipo && conversacion.member_count
              ? `${conversacion.member_count} integrantes · `
              : ""}
            {TEXTO_ESTADO[estado] ?? estado}
          </span>
        </div>

        {onCerrar && (
          <button
            type="button"
            onClick={onCerrar}
            aria-label="Cerrar chat"
            className="flex h-8 w-8 shrink-0 items-center justify-center rounded-lg text-ganker-muted transition hover:bg-ganker-surface-light hover:text-ganker-text"
          >
            ×
          </button>
        )}
      </header>

      {(error || errorHistorial || errorAnteriores) && (
        <div className="border-b border-ganker-error/20 bg-ganker-error/10 px-4 py-2">
          <p className="text-xs text-ganker-error">
            {error || errorHistorial || errorAnteriores}
          </p>
        </div>
      )}

      <div
        ref={mensajesRef}
        className="flex-1 space-y-3 overflow-y-auto px-4 py-4"
      >
        {hayMasAnteriores && mensajes.length > 0 && (
          <div className="flex justify-center pb-1">
            <button
              type="button"
              onClick={cargarMensajesAnteriores}
              disabled={cargandoAnteriores}
              className="rounded-full border border-white/10 bg-ganker-surface-light px-3 py-1 text-xs text-ganker-muted transition hover:text-ganker-text disabled:opacity-50"
            >
              {cargandoAnteriores
                ? "Cargando..."
                : "Cargar mensajes anteriores"}
            </button>
          </div>
        )}

        {mensajes.length === 0 ? (
          <p className="mt-8 text-center text-sm text-ganker-muted">
            Todavía no hay mensajes. ¡Escribí el primero!
          </p>
        ) : (
          mensajes.map((mensaje, indice) => {
            const siguiente = mensajes[indice + 1];

            const mostrarHora =
              !siguiente ||
              siguiente.sender_id !== mensaje.sender_id ||
              !mismoMinuto(mensaje.timestamp, siguiente.timestamp);

            // En el chat del equipo el nombre va solo al empezar una tanda
            // de mensajes de otra persona (no se repite en cada globo).
            const anterior = mensajes[indice - 1];
            const autor =
              esDeEquipo &&
              mensaje.sender_id !== currentUserId &&
              anterior?.sender_id !== mensaje.sender_id
                ? mensaje.sender_name || mensaje.sender_username
                : null;

            return (
              <MessageBubbleComponent
                key={mensaje.message_id ?? indice}
                mensaje={mensaje}
                esPropio={mensaje.sender_id === currentUserId}
                mostrarHora={mostrarHora}
                autor={autor}
                // El chatroom no informa quien leyo cada mensaje.
                mostrarIndicadorLeido={
                  !esDeEquipo && indice === indiceUltimoMensajePropio
                }
              />
            );
          })
        )}
      </div>

      <MessageInputComponent
        onEnviar={enviarMensaje}
        deshabilitado={!conectado}
      />
    </div>
  );
};

export default ChatWindowComponent;
