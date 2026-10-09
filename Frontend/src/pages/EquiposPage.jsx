import { Link } from "react-router-dom";
import useMiEquipo from "../hooks/useMiEquipo";

const CLASES_BOTON_PRINCIPAL =
  "inline-block w-full shrink-0 rounded-xl bg-gradient-to-r from-ganker-orange to-ganker-purple px-5 py-3 text-center text-sm font-semibold text-white transition hover:opacity-90 sm:w-auto";

// Entrada a la seccion Equipos. Por ahora ofrece crear un equipo (US 14) o
// ir al propio si el jugador ya esta en uno; buscar equipos se suma aca.
const EquiposPage = () => {
  const { equipo, cargando, error } = useMiEquipo();

  return (
    <section className="min-h-full bg-ganker-bg px-4 py-6 sm:px-6 lg:px-8">
      <div className="mx-auto w-full max-w-4xl">
        <header className="mb-8">
          <h1 className="font-heading text-3xl font-bold text-ganker-text sm:text-4xl">
            Equipos
          </h1>
          <p className="mt-2 max-w-2xl text-sm text-ganker-muted sm:text-base">
            Creá tu equipo y reclutá jugadores afines a tu rango y tus roles.
          </p>
        </header>

        <div className="rounded-2xl border border-white/10 bg-ganker-surface p-5 sm:p-6">
          {cargando ? (
            <p className="text-sm text-ganker-muted">Cargando...</p>
          ) : error ? (
            // Sin saber si ya tiene equipo no ofrecemos crear uno.
            <p className="text-sm text-ganker-error">{error}</p>
          ) : equipo ? (
            <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
              <div>
                <h2 className="font-heading text-xl font-semibold text-ganker-text">
                  {equipo.team_name}
                </h2>
                <p className="mt-1 text-sm text-ganker-muted">
                  {equipo.videogame?.name} · {equipo.player_count}/
                  {equipo.max_players} jugadores
                </p>
              </div>
              <Link
                to="/app/equipos/mi-equipo"
                className={CLASES_BOTON_PRINCIPAL}
              >
                Ver mi equipo
              </Link>
            </div>
          ) : (
            <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
              <div>
                <h2 className="font-heading text-xl font-semibold text-ganker-text">
                  Todavía no tenés equipo
                </h2>
                <p className="mt-1 text-sm text-ganker-muted">
                  Armá una sala y elegí qué roles y rangos buscás.
                </p>
              </div>
              <Link to="/app/equipos/crear" className={CLASES_BOTON_PRINCIPAL}>
                + Crear equipo
              </Link>
            </div>
          )}
        </div>
      </div>
    </section>
  );
};

export default EquiposPage;
