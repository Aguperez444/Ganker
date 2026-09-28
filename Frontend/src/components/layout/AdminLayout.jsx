import { useState } from "react";
import { Outlet } from "react-router-dom";
import AdminMobileMenu from "./AdminMobileMenu.jsx";
import AdminSidebar from "./AdminSidebar.jsx";
import TopNavbar from "./TopNavbar.jsx";

const AdminLayout = () => {
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);

  return (
    <div className="flex min-h-screen bg-ganker-bg font-body text-ganker-text">
      <AdminSidebar />

      <div className="flex min-w-0 flex-1 flex-col">
        <TopNavbar
          onOpenMenu={() => setIsMobileMenuOpen(true)}
          showChatButton={false}
        />

        <main className="min-w-0 flex-1 overflow-y-auto">
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
