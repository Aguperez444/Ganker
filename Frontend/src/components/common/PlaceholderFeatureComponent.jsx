import { Link } from "react-router-dom";

/**
 * Componente genérico para pantallas placeholder de funcionalidades
 * previstas para futuros sprints. Mantiene el diseño, estructura y
 * estilo visual del dashboard.
 */
const PlaceholderFeatureComponent = ({
  funcionalidad,
  titulo,
  descripcion,
  icon,
  badge = "En desarrollo",
  volverRuta = "/app",
  volverTexto = "Volver al inicio",
}) => {
  const nombreMostrar = titulo || funcionalidad;

  return (
    <section className="min-h-full bg-ganker-bg px-4 py-6 sm:px-6 lg:px-8">
      <div className="mx-auto w-full max-w-4xl space-y-6">
        <header>
          <div className="flex items-center gap-3">
            <span className="inline-flex items-center rounded-full border border-ganker-purple/30 bg-ganker-purple/10 px-3 py-1 text-xs font-semibold tracking-wide text-ganker-purple-light uppercase">
              {badge}
            </span>
          </div>

          <h1 className="mt-3 font-heading text-3xl font-bold text-ganker-text sm:text-4xl">
            {nombreMostrar}
          </h1>

          {descripcion && (
            <p className="mt-2 max-w-2xl text-sm text-ganker-muted sm:text-base">
              {descripcion}
            </p>
          )}
        </header>

        <div className="flex min-h-[360px] flex-col items-center justify-center rounded-2xl border border-white/10 bg-ganker-surface p-6 text-center shadow-xl sm:p-12">
          <div className="mb-6 flex h-20 w-20 items-center justify-center rounded-2xl border border-white/10 bg-ganker-surface-light text-ganker-purple-light shadow-inner">
            {icon || (
              <svg
                viewBox="0 0 24 24"
                fill="none"
                stroke="currentColor"
                strokeWidth="1.8"
                className="h-10 w-10"
                aria-hidden="true"
              >
                <path d="M12 2v20M17 5H9.5a3.5 3.5 0 0 0 0 7h5a3.5 3.5 0 0 1 0 7H6" />
              </svg>
            )}
          </div>

          <p className="font-heading text-xl font-bold text-ganker-orange sm:text-2xl">
            [{funcionalidad}] se implementará en un próximo sprint...
          </p>

          <p className="mt-3 max-w-md text-sm text-ganker-muted sm:text-base">
            Estamos preparando esta sección para que puedas disfrutar de la
            experiencia completa de {funcionalidad.toLowerCase()} en Ganker.
          </p>

          <div className="mt-8 flex flex-wrap items-center justify-center gap-4">
            <Link
              to={volverRuta}
              className="inline-flex cursor-pointer items-center justify-center rounded-xl bg-gradient-to-r from-ganker-orange to-ganker-purple px-6 py-3 text-sm font-semibold text-white shadow-lg shadow-ganker-purple/20 transition-all duration-200 hover:-translate-y-0.5 hover:opacity-95"
            >
              {volverTexto}
            </Link>
          </div>
        </div>
      </div>
    </section>
  );
};

export default PlaceholderFeatureComponent;
