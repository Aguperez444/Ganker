import { useState } from "react";
import { Outlet } from "react-router-dom";
import AdminMobileMenu from "./AdminMobileMenu.jsx";
import AdminSidebar from "./AdminSidebar.jsx";
import TopNavbar from "./TopNavbar.jsx";

const AdminLayout = () => {
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);

  return (
    // Alto fijo de pantalla (igual que AppLayout): solo scrollea el <main>,
    // asi el sidebar y el navbar quedan quietos al bajar en la pagina.
    <div className="flex h-screen overflow-hidden bg-ganker-bg font-body text-ganker-text">
      <AdminSidebar />

      <div className="flex h-full min-w-0 flex-1 flex-col overflow-hidden">
        <TopNavbar
          onOpenMenu={() => setIsMobileMenuOpen(true)}
          showChatButton={false}
        />

        <main className="relative min-w-0 flex-1 overflow-y-auto">
          <Outlet />
        </main>
      </div>

      <AdminMobileMenu
        isOpen={isMobileMenuOpen}
        onClose={() => setIsMobileMenuOpen(false)}
      />
    </div>
  );
};

export default AdminLayout;
