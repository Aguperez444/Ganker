import { NavLink } from "react-router-dom";

export const navigationItems = [
  {
    label: "Inicio",
    path: "/app",
    end: true,
  },
  {
    label: "Buscar",
    path: "/app/jugadores",
  },
  {
    label: "Equipos",
    path: "/app/equipos",
  },
  {
    label: "Mi perfil",
    path: "/app/perfil",
  },
  {
    label: "Cuenta",
    path: "/app/cuenta",
  },
];

const Sidebar = () => {
  return (
    <aside className="hidden w-20 shrink-0 flex-col border-r border-white/10 bg-ganker-surface lg:flex">
      <div className="flex h-17 items-center justify-center border-b border-white/10">
        <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-gradient-to-br from-ganker-orange to-ganker-purple font-heading text-lg font-bold text-white">
          G
        </div>
      </div>

      <nav className="flex flex-1 flex-col gap-2 px-2 py-5">
        {navigationItems.map((item) => (
          <NavLink
            key={item.label}
            to={item.path}
            end={item.end}
            className={({ isActive }) =>
              [
                "flex flex-col items-center justify-center rounded-xl px-2 py-3 text-center text-[10px] font-semibold tracking-wide uppercase transition",
                isActive
                  ? "bg-ganker-purple/30 text-ganker-text"
                  : "text-ganker-muted hover:bg-ganker-surface-light hover:text-ganker-text",
              ].join(" ")
            }
          >
            {item.label}
          </NavLink>
        ))}

        <div className="mt-auto">
          <NavLink
            to="/app/admin"
            className={({ isActive }) =>
              [
                "flex flex-col items-center justify-center rounded-xl px-2 py-3 text-center text-[10px] font-semibold tracking-wide uppercase transition",
                isActive
                  ? "bg-ganker-purple/30 text-ganker-text"
                  : "text-ganker-muted hover:bg-ganker-surface-light hover:text-ganker-text",
              ].join(" ")
            }
          >
            Admin
          </NavLink>
        </div>
      </nav>
    </aside>
  );
};

export default Sidebar;
