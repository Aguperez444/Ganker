import { useState } from "react";
import { Outlet } from "react-router-dom";
import ChatDrawer from "./ChatDrawer.jsx";
import MobileMenu from "./MobileMenu.jsx";
import Sidebar from "./Sidebar.jsx";
import TopNavbar from "./TopNavbar.jsx";
import ChatSidebarComponent from "../chat/ChatSidebarComponent.jsx";
import { ChatProvider, useChat } from "../../context/ChatContext.jsx";
import { useIsDesktop } from "../../hooks/useIsDesktop.js";

const AppLayoutContenido = () => {
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);
  const {
    chatAbierto,
    cerrarChat,
    panelDesktopVisible,
    alternarChat,
    alternarPanelDesktop,
  } = useChat();
  const esDesktop = useIsDesktop();

  // En desktop el boton de "Enviar mensaje" oculta/muestra el panel fijo;
  // en mobile/tablet abre/cierra el drawer superpuesto (no hay panel fijo
  // que ocultar ahi).
  const onOpenChat = esDesktop ? alternarPanelDesktop : alternarChat;

  return (
    <div className="flex h-screen overflow-hidden bg-ganker-bg font-body text-ganker-text">
      {/* Navegación desktop/tablet */}
      <Sidebar />

      <div className="flex h-full min-w-0 flex-1 flex-col overflow-hidden">
        <TopNavbar
          onOpenMenu={() => setIsMobileMenuOpen(true)}
          onOpenChat={onOpenChat}
          chatVisible={esDesktop ? panelDesktopVisible : chatAbierto}
        />

        <div className="flex min-h-0 flex-1 overflow-hidden">
          {/* Contenido dinámico */}
          <main className="min-w-0 flex-1 overflow-y-auto">
            <Outlet />
          </main>

          {/* Chat permanente en desktop grande, salvo que el jugador lo
              haya ocultado con el boton de "Enviar mensaje". */}
          {esDesktop && panelDesktopVisible && (
            <aside className="flex h-full w-96 shrink-0 flex-col overflow-hidden border-l border-white/10 bg-ganker-surface">
              <ChatSidebarComponent />
            </aside>
          )}
        </div>
      </div>

      {/* Menú mobile */}
      <MobileMenu
        isOpen={isMobileMenuOpen}
        onClose={() => setIsMobileMenuOpen(false)}
      />

      {/* Chat tablet/mobile */}
      {!esDesktop && <ChatDrawer isOpen={chatAbierto} onClose={cerrarChat} />}
    </div>
  );
};

const AppLayout = () => {
  return (
    <ChatProvider>
      <AppLayoutContenido />
    </ChatProvider>
  );
};

export default AppLayout;
