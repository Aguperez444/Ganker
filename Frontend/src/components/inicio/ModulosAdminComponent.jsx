import { Link } from "react-router-dom";

// Modulos del panel admin agrupados por area. Cada grupo:
// { titulo, modulos: [{ titulo, descripcion, path, botonTexto }] }.
function ModulosAdminComponent({ grupos }) {
  return (
    <div className="space-y-6">
      {grupos.map((grupo) => (
        <section key={grupo.titulo}>
          <h2 className="mb-3 text-xs font-semibold tracking-[0.15em] text-ganker-purple-light uppercase">
            {grupo.titulo}
          </h2>
          <ul className="grid gap-3 sm:grid-cols-2 xl:grid-cols-4">
            {grupo.modulos.map((modulo) => (
              <li key={modulo.path}>
                <Link
                  to={modulo.path}
                  aria-label={modulo.botonTexto}
                  className="group flex h-full flex-col rounded-2xl border border-white/10 bg-ganker-surface p-4 transition hover:border-ganker-purple-light/50 hover:bg-ganker-surface-light"
                >
                  <span className="font-heading font-semibold text-ganker-text">
                    {modulo.titulo}
                  </span>
                  <span className="mt-1 flex-1 text-xs text-ganker-muted">
                    {modulo.descripcion}
                  </span>
                  <span className="mt-3 text-xs font-semibold text-ganker-purple-light transition group-hover:translate-x-0.5">
                    {modulo.botonTexto} →
                  </span>
                </Link>
              </li>
            ))}
          </ul>
        </section>
      ))}
    </div>
  );
}

export default ModulosAdminComponent;
