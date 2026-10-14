import { useNavigate } from "react-router-dom";
import { useChat } from "../../context/ChatContext";
import { rutaPerfilJugador } from "../../utils/rutas";
import ConversationListComponent from "./ConversationListComponent";
import ChatWindowComponent from "./ChatWindowComponent";

/**
 * US 10 - Panel de chat: conmuta entre la lista de conversaciones y la
 * ventana de la conversacion activa. Lo usan tanto el panel fijo de
 * desktop (AppLayout) como el drawer de mobile (ChatDrawer).
 */
const ChatSidebarComponent = ({ onCerrar }) => {
  const navigate = useNavigate();
  const {
    conversaciones,
    conversacionActiva,
    conversacionActivaId,
    cargando,
    error,
    currentUserId,
    seleccionarConversacion,
    cerrarConversacionActiva,
    cargarConversaciones,
    manejarMensajeDeSalaActiva,
  } = useChat();

  // En desktop el chat es un panel fijo y queda abierto al lado del perfil.
  // En mobile es un drawer (onCerrar) que taparia el perfil, asi que se cierra.
  const handleVerPerfil = (userId) => {
    navigate(rutaPerfilJugador(userId));
    onCerrar?.();
  };

  if (conversacionActivaId && conversacionActiva) {
    return (
      <ChatWindowComponent
        key={conversacionActiva.conversation_id}
        conversacion={conversacionActiva}
        currentUserId={currentUserId}
        onVolver={cerrarConversacionActiva}
        onCerrar={onCerrar}
        onMensaje={manejarMensajeDeSalaActiva}
        onVerPerfil={handleVerPerfil}
      />
    );
  }

  return (
    <ConversationListComponent
      conversaciones={conversaciones}
      conversacionActivaId={conversacionActivaId}
      onSeleccionar={seleccionarConversacion}
      onActualizar={cargarConversaciones}
      cargando={cargando}
      error={error}
      onCerrar={onCerrar}
    />
  );
};

export default ChatSidebarComponent;
