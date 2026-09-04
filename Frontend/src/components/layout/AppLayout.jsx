import { useState } from "react";
import { Outlet } from "react-router-dom";
import ChatDrawer from "./ChatDrawer.jsx";
import MobileMenu from "./MobileMenu.jsx";
import Sidebar from "./Sidebar.jsx";
import TopNavbar from "./TopNavbar.jsx";

const AppLayout = () => {
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);
  const [isChatOpen, setIsChatOpen] = useState(false);

  return (
    <div className="flex min-h-screen bg-ganker-bg font-body text-ganker-text">
      {/* Navegación desktop/tablet */}
      <Sidebar />

      <div className="flex min-w-0 flex-1 flex-col">
        <TopNavbar
          onOpenMenu={() => setIsMobileMenuOpen(true)}
          onOpenChat={() => setIsChatOpen(true)}
        />

        <div className="flex min-h-0 flex-1">
          {/* Contenido dinámico */}
          <main className="min-w-0 flex-1 overflow-y-auto">
            <Outlet />
          </main>

          {/* Chat permanente únicamente en desktop grande */}
          <aside className="hidden w-80 shrink-0 border-l border-white/10 bg-ganker-surface xl:flex xl:flex-col">
            <div className="border-b border-white/10 px-6 py-5">
              <h2 className="font-heading text-lg font-semibold text-ganker-text">
                Conversaciones
              </h2>
            </div>

            <div className="flex flex-1 items-center justify-center px-6 text-center">
              <p className="text-sm text-ganker-muted">
                El chat se integrará en las próximas User Stories.
              </p>
            </div>
          </aside>
        </div>
      </div>

      {/* Menú mobile */}
      <MobileMenu
        isOpen={isMobileMenuOpen}
        onClose={() => setIsMobileMenuOpen(false)}
      />

      {/* Chat tablet/mobile */}
      <ChatDrawer isOpen={isChatOpen} onClose={() => setIsChatOpen(false)} />
    </div>
  );
};

export default AppLayout;
