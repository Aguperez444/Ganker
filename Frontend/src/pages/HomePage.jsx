import { Link } from "react-router-dom";

const HomePage = () => {
  const secciones = [
    {
      titulo: "Buscar jugadores",
      descripcion:
        "Encontrá compañeros y rivales según tu nivel, juego, rol y horarios.",
      path: "/app/jugadores",
      botonTexto: "Buscar jugadores",
      badge: "Próximo sprint",
      icon: (
        <svg
          viewBox="0 0 24 24"
          fill="none"
          stroke="currentColor"
          strokeWidth="1.8"
          className="h-6 w-6"
          aria-hidden="true"
        >
          <path d="M16 21v-2a4 4 0 0 0-4-4H6a4 4 0 0 0-4 4v2" />
          <circle cx="9" cy="7" r="4" />
          <path d="M22 21v-2a4 4 0 0 0-3-3.87" />
          <path d="M16 3.13a4 4 0 0 1 0 7.75" />
        </svg>
      ),
    },
    {
      titulo: "Equipos",
      descripcion:
        "Creá tu escuadra, reclutá compañeros y gestioná el roster de tu equipo.",
      path: "/app/equipos",
      botonTexto: "Ver equipos",
      badge: "Próximo sprint",
      icon: (
        <svg
          viewBox="0 0 24 24"
          fill="none"
          stroke="currentColor"
          strokeWidth="1.8"
          className="h-6 w-6"
          aria-hidden="true"
        >
          <path d="M12 2l8 4.5v6c0 5-3.5 9.5-8 11-4.5-1.5-8-6-8-11v-6L12 2z" />
          <path d="M9 12l2 2 4-4" />
        </svg>
      ),
    },
    {
      titulo: "Mi perfil",
      descripcion:
        "Administrá tus perfiles de juego, personajes principales y roles preferidos.",
      path: "/app/perfil",
      botonTexto: "Ir a mi perfil",
      badge: "Disponible",
      icon: (
        <svg
          viewBox="0 0 24 24"
          fill="none"
          stroke="currentColor"
          strokeWidth="1.8"
          className="h-6 w-6"
          aria-hidden="true"
        >
          <path d="M20 21v-2a4 4 0 0 0-4-4H8a4 4 0 0 0-4 4v2" />
          <circle cx="12" cy="7" r="4" />
        </svg>
      ),
    },
    {
      titulo: "Mi cuenta",
      descripcion:
        "Actualizá tus datos personales, correo de contacto y foto de avatar.",
      path: "/app/cuenta",
      botonTexto: "Configurar cuenta",
      badge: "Disponible",
      icon: (
        <svg
          viewBox="0 0 24 24"
          fill="none"
          stroke="currentColor"
          strokeWidth="1.8"
          className="h-6 w-6"
          aria-hidden="true"
        >
          <circle cx="12" cy="12" r="3" />
          <path d="M19.4 15a1.65 1.65 0 0 0 .33 1.82l.06.06a2 2 0 1 1-2.83 2.83l-.06-.06a1.65 1.65 0 0 0-1.82-.33 1.65 1.65 0 0 0-1 1.51V21a2 2 0 1 1-4 0v-.09A1.65 1.65 0 0 0 9 19.4a1.65 1.65 0 0 0-1.82.33l-.06.06a2 2 0 1 1-2.83-2.83l.06-.06a1.65 1.65 0 0 0 .33-1.82 1.65 1.65 0 0 0-1.51-1H3a2 2 0 1 1 0-4h.09A1.65 1.65 0 0 0 4.6 9a1.65 1.65 0 0 0-.33-1.82l-.06-.06a2 2 0 1 1 2.83-2.83l.06.06a1.65 1.65 0 0 0 1.82.33H9a1.65 1.65 0 0 0 1-1.51V3a2 2 0 1 1 4 0v.09a1.65 1.65 0 0 0 1 1.51 1.65 1.65 0 0 0 1.82-.33l.06-.06a2 2 0 1 1 2.83 2.83l-.06.06a1.65 1.65 0 0 0-.33 1.82V9a1.65 1.65 0 0 0 1.51 1H21a2 2 0 1 1 0 4h-.09a1.65 1.65 0 0 0-1.51 1z" />
        </svg>
      ),
    },
  ];

  return (
    <section className="min-h-full bg-ganker-bg px-4 py-6 sm:px-6 lg:px-8">
      <div className="mx-auto w-full max-w-5xl space-y-8">
        <header className="rounded-2xl border border-white/10 bg-ganker-surface p-6 sm:p-8">
          <span className="inline-flex items-center rounded-full border border-ganker-purple/30 bg-ganker-purple/10 px-3 py-1 text-xs font-semibold tracking-wide text-ganker-purple-light uppercase">
            Panel principal
          </span>

          <h1 className="mt-3 font-heading text-3xl font-bold text-ganker-text sm:text-4xl">
            Inicio
          </h1>

          <p className="mt-2 text-base font-semibold text-ganker-orange">
            [Inicio] se implementará en un próximo sprint...
          </p>

          <p className="mt-1 text-sm text-ganker-muted">
            Bienvenido a Ganker. Desde acá podrás explorar las secciones
            disponibles y en desarrollo.
          </p>
        </header>

        <div>
          <h2 className="mb-4 font-heading text-xl font-semibold text-ganker-text">
            Accesos directos
          </h2>

          <div className="grid gap-4 sm:grid-cols-2">
            {secciones.map((sec) => (
              <div
                key={sec.titulo}
                className="flex flex-col justify-between rounded-2xl border border-white/10 bg-ganker-surface p-6 transition hover:border-ganker-purple/40"
              >
                <div>
                  <div className="flex items-center justify-between">
                    <div className="flex h-12 w-12 items-center justify-center rounded-xl bg-ganker-surface-light text-ganker-purple-light">
                      {sec.icon}
                    </div>
                    <span
                      className={`rounded-full px-2.5 py-0.5 text-xs font-semibold ${
                        sec.badge === "Disponible"
                          ? "border border-ganker-success/30 bg-ganker-success/10 text-ganker-success"
                          : "border border-ganker-purple/30 bg-ganker-purple/10 text-ganker-purple-light"
                      }`}
                    >
                      {sec.badge}
                    </span>
                  </div>

                  <h3 className="mt-4 font-heading text-lg font-semibold text-ganker-text">
                    {sec.titulo}
                  </h3>

                  <p className="mt-1 text-sm text-ganker-muted">
                    {sec.descripcion}
                  </p>
                </div>

                <div className="mt-6">
                  <Link
                    to={sec.path}
                    className="inline-flex w-full items-center justify-center rounded-xl border border-white/10 bg-ganker-surface-light px-4 py-2.5 text-sm font-semibold text-ganker-text transition hover:border-ganker-purple/40 hover:bg-ganker-purple/20 sm:w-auto"
                  >
                    {sec.botonTexto} →
                  </Link>
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>
    </section>
  );
};

export default HomePage;
