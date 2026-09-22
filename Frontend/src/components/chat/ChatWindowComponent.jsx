import { useEffect, useMemo, useRef, useState } from "react";
import AvatarUsuarioComponent from "../common/AvatarUsuarioComponent";
import { useChatSocket } from "../../hooks/useChatSocket";
import { useChat } from "../../context/ChatContext";
import { obtenerHistorialMensajes } from "../../api/chatApi";
import MessageBubbleComponent from "./MessageBubbleComponent";
import MessageInputComponent from "./MessageInputComponent";

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

// Carga el historial antes de montar ChatWindowInterna: useChatSocket solo
// lee mensajesIniciales una vez, al montarse.
const ChatWindowComponent = ({
  conversacion,
  currentUserId,
  onVolver,
  onCerrar,
  onMensaje,
}) => {
  const { obtenerMensajesDeConversacion, sembrarMensajesDeConversacion } =
    useChat();

  // Lectura pura del cache: si ya se cargo esta conversacion en la sesion
  // actual, no hace falta pedirla de nuevo.
  const mensajesCacheados = obtenerMensajesDeConversacion(
    conversacion.conversation_id
  );

  const [mensajesDelFetch, setMensajesDelFetch] = useState(null);
  const [errorHistorial, setErrorHistorial] = useState(null);

  useEffect(() => {
    if (mensajesCacheados) return;

    let cancelado = false;

    obtenerHistorialMensajes(conversacion.conversation_id, {
      page: 1,
      size: TAMANO_PAGINA_HISTORIAL,
    })
      .then((mensajes) => {
        if (cancelado) return;
        // El backend los devuelve del mas nuevo al mas viejo.
        const ordenados = [...mensajes].reverse();
        sembrarMensajesDeConversacion(
          conversacion.conversation_id,
          ordenados
        );
        setMensajesDelFetch(ordenados);
      })
      .catch((err) => {
        if (cancelado) return;
        console.error("Error al cargar el historial de mensajes:", err);
        setErrorHistorial("No se pudo cargar el historial de mensajes.");
        setMensajesDelFetch([]);
      });

    return () => {
      cancelado = true;
    };
    // Solo debe correr al montar (el componente se remonta por conversacion).
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [conversacion.conversation_id]);

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

// A diferencia del resto de componentes del proyecto, este abre su propia
// conexion (useChatSocket). `onMensaje` avisa a ChatContext de cada mensaje
// para actualizar el ultimo mensaje de la lista de conversaciones.
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
  const mensajesRef = useRef(null);
  const [cargandoAnteriores, setCargandoAnteriores] = useState(false);
  const [errorAnteriores, setErrorAnteriores] = useState(null);
  const [hayMasAnteriores, setHayMasAnteriores] = useState(
    mensajesIniciales.length >= TAMANO_PAGINA_HISTORIAL
  );
  const paginaRef = useRef(1);

  const otroParticipante = conversacion.other_participant;
  const nombreOtro =
    otroParticipante?.name || otroParticipante?.username || "Jugador";

  // Cubre el caso de reabrir el panel/drawer con una conversacion ya
  // activa: eso remonta este componente sin pasar por seleccionarConversacion.
  useEffect(() => {
    marcarConversacionComoVista(conversacion.conversation_id);
  }, [conversacion.conversation_id, marcarConversacionComoVista]);

  const { mensajes, setMensajes, estado, error, enviarMensaje } =
    useChatSocket(
      conversacion.conversation_id,
      mensajesIniciales,
      (mensaje) => onMensaje?.(conversacion.conversation_id, mensaje)
    );

  // El check de "leido" se muestra en cascada: solo en el ultimo mensaje propio.
  const indiceUltimoMensajePropio = useMemo(() => {
    for (let i = mensajes.length - 1; i >= 0; i--) {
      if (mensajes[i].sender_id === currentUserId) return i;
    }
    return -1;
  }, [mensajes, currentUserId]);

  // Mantiene el cache de ChatContext al dia con lo que se ve en pantalla.
  useEffect(() => {
    actualizarMensajesDeConversacion(conversacion.conversation_id, mensajes);
  }, [conversacion.conversation_id, mensajes, actualizarMensajesDeConversacion]);

  // Guarda la altura/scroll previos para restaurar la posicion al
  // prepender mensajes viejos (el navegador no lo hace solo).
  const restaurarScrollRef = useRef(null);

  const cargarMensajesAnteriores = async () => {
    if (cargandoAnteriores || !hayMasAnteriores) return;

    setCargandoAnteriores(true);
    setErrorAnteriores(null);
    const siguientePagina = paginaRef.current + 1;

    try {
      const mensajesAnteriores = await obtenerHistorialMensajes(
        conversacion.conversation_id,
        { page: siguientePagina, size: TAMANO_PAGINA_HISTORIAL }
      );

      paginaRef.current = siguientePagina;
      setHayMasAnteriores(mensajesAnteriores.length >= TAMANO_PAGINA_HISTORIAL);

      if (mensajesAnteriores.length > 0) {
        const ordenados = [...mensajesAnteriores].reverse();
        const contenedor = mensajesRef.current;
        restaurarScrollRef.current = contenedor
          ? { alturaPrevia: contenedor.scrollHeight, scrollPrevio: contenedor.scrollTop }
          : null;

        setMensajes((actuales) => {
          const idsExistentes = new Set(
            actuales.map((m) => m.message_id).filter((id) => id != null)
          );
          const nuevos = ordenados.filter(
            (m) => !idsExistentes.has(m.message_id)
          );
          return [...nuevos, ...actuales];
        });
      }
    } catch (err) {
      console.error("Error al cargar mensajes anteriores:", err);
      setErrorAnteriores("No se pudieron cargar mensajes anteriores.");
    } finally {
      setCargandoAnteriores(false);
    }
  };

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
          <AvatarUsuarioComponent user={otroParticipante} alt={nombreOtro} />
        </div>

        <div className="min-w-0 flex-1">
          <h3 className="truncate font-heading text-sm font-semibold text-ganker-text">
            {nombreOtro}
          </h3>
          <span className="text-[11px] text-ganker-muted">
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
            // Agrupa la hora solo dentro de una tanda del mismo remitente.
            const mostrarHora =
              !siguiente ||
              siguiente.sender_id !== mensaje.sender_id ||
              !mismoMinuto(mensaje.timestamp, siguiente.timestamp);

            return (
              <MessageBubbleComponent
                key={mensaje.message_id ?? indice}
                mensaje={mensaje}
                esPropio={mensaje.sender_id === currentUserId}
                mostrarHora={mostrarHora}
                mostrarIndicadorLeido={indice === indiceUltimoMensajePropio}
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
