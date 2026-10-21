import { NavLink } from "react-router-dom";

const PESTANAS = [
  {
    ruta: "/app/admin/reportes",
    etiqueta: "Perfiles por videojuego",
    end: true,
  },
  { ruta: "/app/admin/reportes/uso", etiqueta: "Rangos, personajes y equipos" },
];

// Pestañas de Admin > Reportes: US 37 (perfiles por videojuego) y US 38 (uso
// por videojuego). Cada una es su propia page.
const ReportesTabsComponent = () => (
  <nav
    aria-label="Tipos de reporte"
    className="flex flex-wrap gap-2 rounded-xl border border-white/10 bg-ganker-surface p-1"
  >
    {PESTANAS.map(({ ruta, etiqueta, end }) => (
      <NavLink
        key={ruta}
        to={ruta}
        end={end}
        className={({ isActive }) =>
          [
            "flex-1 rounded-lg px-4 py-2 text-center text-sm font-semibold transition",
            isActive
              ? "bg-ganker-purple text-ganker-text"
              : "text-ganker-muted hover:text-ganker-text",
          ].join(" ")
        }
      >
        {etiqueta}
      </NavLink>
    ))}
  </nav>
);

export default ReportesTabsComponent;
