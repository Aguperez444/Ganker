import { useState } from "react";
import { Outlet } from "react-router-dom";
import AdminMobileMenu from "./AdminMobileMenu.jsx";
import AdminSidebar from "./AdminSidebar.jsx";
import ChatDrawer from "./ChatDrawer.jsx";
import TopNavbar from "./TopNavbar.jsx";
import ChatSidebarComponent from "../chat/ChatSidebarComponent.jsx";
import { ChatProvider, useChat } from "../../context/ChatContext.jsx";
import { useIsDesktop } from "../../hooks/useIsDesktop.js";

const AdminLayoutContenido = () => {
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);
  const {
    chatAbierto,
    cerrarChat,
    panelDesktopVisible,
    alternarChat,
    alternarPanelDesktop,
  } = useChat();
  const esDesktop = useIsDesktop();

  // Mismo criterio que AppLayout: en desktop el chat es un panel fijo al
  // costado (no bloquea el resto de la pantalla), en mobile/tablet es un
  // drawer superpuesto.
  const onOpenChat = esDesktop ? alternarPanelDesktop : alternarChat;

  return (
    <div className="flex h-screen overflow-hidden bg-ganker-bg font-body text-ganker-text">
      <AdminSidebar />

      <div className="flex h-full min-w-0 flex-1 flex-col overflow-hidden">
        <TopNavbar
          onOpenMenu={() => setIsMobileMenuOpen(true)}
          onOpenChat={onOpenChat}
          chatVisible={esDesktop ? panelDesktopVisible : chatAbierto}
        />

        <div className="flex min-h-0 flex-1 overflow-hidden">
          <main className="min-w-0 flex-1 overflow-y-auto">
            <Outlet />
          </main>

          {/* Panel de chat fijo en desktop, igual que en AppLayout: no tapa
              el panel de admin, el jugador puede seguir trabajando con el
              chat abierto al costado. */}
          {esDesktop && panelDesktopVisible && (
            <aside className="flex h-full w-96 shrink-0 flex-col overflow-hidden border-l border-white/10 bg-ganker-surface">
              <ChatSidebarComponent />
            </aside>
          )}
        </div>
      </div>

      <AdminMobileMenu
        isOpen={isMobileMenuOpen}
        onClose={() => setIsMobileMenuOpen(false)}
      />

      {/* Drawer superpuesto solo en mobile/tablet. */}
      {!esDesktop && <ChatDrawer isOpen={chatAbierto} onClose={cerrarChat} />}
    </div>
  );
};

// TopNavbar lee useChat() para el badge de no leidos y para el atajo de
// enviar mensaje: un admin sigue siendo un usuario que puede recibir y
// mandar mensajes, asi que necesita el mismo provider que AppLayout.
const AdminLayout = () => {
  return (
    <ChatProvider>
      <AdminLayoutContenido />
    </ChatProvider>
  );
};

export default AdminLayout;
