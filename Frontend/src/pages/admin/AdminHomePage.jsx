import { Link } from "react-router-dom";

const AdminHomePage = () => {
  const seccionesAdmin = [
    {
      titulo: "Videojuegos",
      descripcion: "Gestioná los videojuegos soportados por Ganker.",
      path: "/app/admin/games",
      botonTexto: "Gestionar videojuegos",
      badge: "Disponible",
    },
    {
      titulo: "Rangos",
      descripcion: "Administrá las divisiones y rangos por videojuego.",
      path: "/app/admin/ranks",
      botonTexto: "Gestionar rangos",
      badge: "Disponible",
    },
    {
      titulo: "Personajes",
      descripcion: "Administrá los personajes y agentes de cada videojuego.",
      path: "/app/admin/characters",
      botonTexto: "Gestionar personajes",
      badge: "Próximo sprint",
    },
    {
      titulo: "Moderación",
      descripcion: "Supervisá reportes, conductas y sanciones de usuarios.",
      path: "/app/admin/moderacion",
      botonTexto: "Ir a moderación",
      badge: "Próximo sprint",
    },
  ];

  return (
    <section className="min-h-full bg-ganker-bg p-6">
      <div className="mx-auto w-full max-w-5xl space-y-8">
        <header>
          <p className="text-xs font-semibold tracking-[0.15em] text-ganker-purple-light uppercase">
            Administración
          </p>

          <h1 className="mt-2 font-heading text-3xl font-bold text-ganker-text">
            Panel administrativo
          </h1>

          <p className="mt-2 text-base font-semibold text-ganker-orange">
            [Panel administrativo] se implementará en un próximo sprint...
          </p>

          <p className="mt-1 max-w-2xl text-sm text-ganker-muted">
            Desde esta sección se incorporarán las funcionalidades de
            administración de Ganker.
          </p>
        </header>

        <div>
          <h2 className="mb-4 font-heading text-xl font-semibold text-ganker-text">
            Módulos de administración
          </h2>

          <div className="grid gap-4 sm:grid-cols-2">
            {seccionesAdmin.map((sec) => (
              <div
                key={sec.titulo}
                className="flex flex-col justify-between rounded-2xl border border-white/10 bg-ganker-surface p-6 transition hover:border-ganker-purple/40"
              >
                <div>
                  <div className="flex items-center justify-between">
                    <h3 className="font-heading text-lg font-semibold text-ganker-text">
                      {sec.titulo}
                    </h3>
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

                  <p className="mt-2 text-sm text-ganker-muted">
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

export default AdminHomePage;
