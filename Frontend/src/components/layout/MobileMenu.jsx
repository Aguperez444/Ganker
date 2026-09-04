import { NavLink } from "react-router-dom";
import { navigationItems } from "./Sidebar.jsx";

const MobileMenu = ({ isOpen, onClose }) => {
  if (!isOpen) {
    return null;
  }

  return (
    <div className="fixed inset-0 z-50 lg:hidden">
      {/* Fondo */}
      <button
        type="button"
        aria-label="Cerrar menú"
        onClick={onClose}
        className="absolute inset-0 cursor-default bg-black/60 backdrop-blur-sm"
      />

      {/* Drawer */}
      <aside className="relative flex h-full w-72 max-w-[85vw] flex-col border-r border-white/10 bg-ganker-surface shadow-2xl">
        <header className="flex h-17 items-center justify-between border-b border-white/10 px-5">
          <div className="flex items-center gap-3">
            <div className="flex h-9 w-9 items-center justify-center rounded-lg bg-gradient-to-br from-ganker-orange to-ganker-purple font-heading font-bold text-white">
              G
            </div>

            <span className="font-heading text-lg font-semibold text-ganker-text">
              Ganker
            </span>
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
          {navigationItems.map((item) => (
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

          <div className="my-2 border-t border-white/10" />

          <NavLink
            to="/app/admin"
            onClick={onClose}
            className="rounded-lg px-4 py-3 text-sm font-semibold text-ganker-muted transition hover:bg-ganker-surface-light hover:text-ganker-text"
          >
            Administración
          </NavLink>
        </nav>
      </aside>
    </div>
  );
};

export default MobileMenu;
