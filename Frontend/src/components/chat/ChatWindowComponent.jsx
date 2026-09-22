import { useEffect, useRef } from "react";
import AvatarUsuarioComponent from "../common/AvatarUsuarioComponent";
import { useChatSocket } from "../../hooks/useChatSocket";
import { useChat } from "../../context/ChatContext";
import MessageBubbleComponent from "./MessageBubbleComponent";
import MessageInputComponent from "./MessageInputComponent";

const TEXTO_ESTADO = {
  CONECTANDO: "Conectando...",
  ABIERTO: "En línea",
  CERRADO: "Desconectado",
  ERROR: "Error de conexión",
};

function semillaDesdeUltimoMensaje(conversacion) {
  if (!conversacion.last_message) return [];

  return [
    {
      message_id: null,
      conversation_id: conversacion.conversation_id,
      sender_id: conversacion.last_message.sender_id,
      content: conversacion.last_message.content,
      timestamp: conversacion.last_message.timestamp,
    },
  ];
}

/**
 * US 10 - Ventana de una conversacion activa.
 *
 * A diferencia del resto de los componentes "tontos" del proyecto, este SI
 * abre su propia conexion (useChatSocket): es el mismo criterio que ya usa
 * TopNavbar con useAuth, adaptado a un hook en vez de un context. Que
 * conversacion mostrar se lo decide ChatSidebarComponent por props;
 * conectarse al socket de ESA conversacion es un detalle de esta pantalla.
 *
 * `onMensaje` avisa a ChatContext de cada mensaje que llega (propio o
 * ajeno) para que la lista de conversaciones actualice su ultimo mensaje
 * sin esperar a que el jugador cierre este chat.
 */
const ChatWindowComponent = ({
  conversacion,
  currentUserId,
  onVolver,
  onCerrar,
  onMensaje,
}) => {
  const {
    obtenerMensajesDeConversacion,
    sembrarMensajesDeConversacion,
    marcarConversacionComoVista,
  } = useChat();
  const mensajesRef = useRef(null);

  const otroParticipante = conversacion.other_participant;
  const nombreOtro =
    otroParticipante?.name || otroParticipante?.username || "Jugador";

  // No existe todavia un endpoint de historial completo (ver guia.md), asi
  // que la unica fuente de "mensajes anteriores" es lo que ya se vio en
  // esta sesion del navegador (ChatContext los va acumulando por
  // conversacion). Si el jugador nunca abrio este chat en la sesion actual,
  // arranca con el ultimo mensaje conocido de la lista; si ya lo abrio y
  // cerro, retoma la charla completa donde quedo en vez de volver a mostrar
  // solo el ultimo mensaje.
  //
  // Esta lectura es pura (no mutuar el cache durante el render, ver
  // ChatContext): el useState de useChatSocket solo mira el valor inicial en
  // el primer render de este componente (se vuelve a montar entero cada vez
  // que se abre una conversacion distinta, ver comentario de useChatSocket),
  // asi que necesitamos el valor ya resuelto ACA, sincronicamente. Sembrar el
  // cache para la proxima vez que se abra esta conversacion es un efecto
  // secundario aparte, hecho en el useEffect de abajo.
  const mensajesIniciales =
    obtenerMensajesDeConversacion(conversacion.conversation_id) ??
    semillaDesdeUltimoMensaje(conversacion);

  useEffect(() => {
    sembrarMensajesDeConversacion(
      conversacion.conversation_id,
      mensajesIniciales
    );
  }, [
    conversacion.conversation_id,
    mensajesIniciales,
    sembrarMensajesDeConversacion,
  ]);

  // El panel fijo de desktop y el drawer mobile desmontan este componente
  // entero cuando se ocultan (ver AppLayout/AdminLayout/ChatDrawer), asi que
  // "volver a abrir el chat" con una conversacion que ya estaba activa lo
  // remonta directamente aca, sin pasar por seleccionarConversacion (eso
  // solo ocurre al elegir la conversacion desde la lista). Este efecto cubre
  // ese caso: cualquier no leido que se haya sumado mientras el panel estaba
  // oculto se limpia apenas la conversacion vuelve a estar en pantalla.
  useEffect(() => {
    marcarConversacionComoVista(conversacion.conversation_id);
  }, [conversacion.conversation_id, marcarConversacionComoVista]);

  const { mensajes, estado, error, enviarMensaje } = useChatSocket(
    conversacion.conversation_id,
    mensajesIniciales,
    (mensaje) => onMensaje?.(conversacion.conversation_id, mensaje)
  );

  // Se hace scroll del CONTENEDOR de mensajes directamente (no
  // scrollIntoView sobre un sentinel) para no depender de que el navegador
  // adivine cual es el ancestro scrolleable mas cercano: con muchos
  // mensajes seguidos eso podia terminar scrolleando la pagina entera en
  // vez de esta lista.
  useEffect(() => {
    const contenedor = mensajesRef.current;
    if (!contenedor) return;
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

      {error && (
        <div className="border-b border-ganker-error/20 bg-ganker-error/10 px-4 py-2">
          <p className="text-xs text-ganker-error">{error}</p>
        </div>
      )}

      <div
        ref={mensajesRef}
        className="flex-1 space-y-3 overflow-y-auto px-4 py-4"
      >
        {mensajes.length === 0 ? (
          <p className="mt-8 text-center text-sm text-ganker-muted">
            Todavía no hay mensajes. ¡Escribí el primero!
          </p>
        ) : (
          mensajes.map((mensaje, indice) => (
            <MessageBubbleComponent
              key={mensaje.message_id ?? indice}
              mensaje={mensaje}
              esPropio={mensaje.sender_id === currentUserId}
            />
          ))
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
