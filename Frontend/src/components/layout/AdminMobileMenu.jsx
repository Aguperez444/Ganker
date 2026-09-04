import { NavLink } from "react-router-dom";
import { adminNavigationItems } from "./AdminSidebar.jsx";

const AdminMobileMenu = ({ isOpen, onClose }) => {
  if (!isOpen) {
    return null;
  }

  return (
    <div className="fixed inset-0 z-50 lg:hidden">
      <button
        type="button"
        aria-label="Cerrar menú"
        onClick={onClose}
        className="absolute inset-0 cursor-default bg-black/60 backdrop-blur-sm"
      />

      <aside className="relative flex h-full w-72 max-w-[85vw] flex-col border-r border-white/10 bg-ganker-surface shadow-2xl">
        <header className="flex h-17 items-center justify-between border-b border-white/10 px-5">
          <div>
            <p className="text-xs font-semibold tracking-[0.14em] text-ganker-purple-light uppercase">
              Ganker
            </p>

            <p className="font-heading font-semibold text-ganker-text">
              Administración
            </p>
          </div>

          <button
            type="button"
            onClick={onClose}
            aria-label="Cerrar menú"
            className="flex h-9 w-9 cursor-pointer items-center justify-center rounded-lg text-ganker-muted transition hover:bg-ganker-surface-light hover:text-ganker-text"
          >
            ×
          </button>
        </header>

        <nav className="flex flex-1 flex-col gap-2 p-4">
          {adminNavigationItems.map((item) => (
            <NavLink
              key={item.label}
              to={item.path}
              end={item.end}
              onClick={onClose}
              className={({ isActive }) =>
                [
                  "rounded-lg px-4 py-3 text-sm font-semibold transition",
                  isActive
                    ? "bg-ganker-purple/30 text-ganker-text"
                    : "text-ganker-muted hover:bg-ganker-surface-light hover:text-ganker-text",
                ].join(" ")
              }
            >
              {item.label}
            </NavLink>
          ))}

          <div className="mt-auto border-t border-white/10 pt-4">
            <NavLink
              to="/app"
              onClick={onClose}
              className="block rounded-lg px-4 py-3 text-sm font-semibold text-ganker-muted transition hover:bg-ganker-surface-light hover:text-ganker-text"
            >
              Volver a Ganker
            </NavLink>
          </div>
        </nav>
      </aside>
    </div>
  );
};

export default AdminMobileMenu;
