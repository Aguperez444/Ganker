import { Link } from "react-router-dom";

// Accesos directos del inicio. Cada item: { titulo, descripcion, path, icono }.
function AccesosInicioComponent({ titulo = "Accesos rápidos", accesos }) {
  return (
    <section className="rounded-2xl border border-white/10 bg-ganker-surface p-5">
      <h2 className="font-heading text-lg font-semibold text-ganker-text">
        {titulo}
      </h2>
      <ul className="mt-3 space-y-1">
        {accesos.map((acceso) => (
          <li key={acceso.path}>
            <Link
              to={acceso.path}
              className="group flex items-center gap-3 rounded-xl px-2 py-2.5 transition hover:bg-ganker-surface-light"
            >
              <span className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-ganker-surface-light text-ganker-purple-light transition group-hover:bg-ganker-purple/30">
                {acceso.icono}
              </span>
              <span className="min-w-0">
                <span className="block text-sm font-semibold text-ganker-text">
                  {acceso.titulo}
                </span>
                <span className="block truncate text-xs text-ganker-muted">
                  {acceso.descripcion}
                </span>
              </span>
              <span
                aria-hidden="true"
                className="ml-auto text-ganker-muted transition group-hover:translate-x-0.5 group-hover:text-ganker-text"
              >
                →
              </span>
            </Link>
          </li>
        ))}
      </ul>
    </section>
  );
}

export default AccesosInicioComponent;
