import { Link } from "react-router-dom";
import { useAuth } from "../context/AuthContext";
import useGames from "../hooks/useGames";
import useMiEquipo from "../hooks/useMiEquipo";
import AccesosInicioComponent from "../components/inicio/AccesosInicioComponent";
import BienvenidaInicioComponent from "../components/inicio/BienvenidaInicioComponent";
import FondoJuegoComponent from "../components/inicio/FondoJuegoComponent";
import MiEquipoResumenComponent from "../components/inicio/MiEquipoResumenComponent";
import PerfilJuegoCardComponent from "../components/inicio/PerfilJuegoCardComponent";
import { rolConMejorRango } from "../utils/juegos";

const icono = (d) => (
  <svg
    viewBox="0 0 24 24"
    fill="none"
    stroke="currentColor"
    strokeWidth="1.8"
    strokeLinecap="round"
    strokeLinejoin="round"
    className="h-5 w-5"
    aria-hidden="true"
  >
    {d}
  </svg>
);

const ACCESOS = [
  {
    titulo: "Buscar jugadores",
    descripcion: "Compañeros según juego, rol y rango",
    path: "/app/jugadores",
    icono: icono(
      <>
        <circle cx="11" cy="11" r="7" />
        <path d="m20 20-3.5-3.5" />
      </>
    ),
  },
  {
    titulo: "Equipos",
    descripcion: "Encontrá un equipo con lugar para vos",
    path: "/app/equipos",
    icono: icono(
      <>
        <path d="M12 2l8 4.5v6c0 5-3.5 9.5-8 11-4.5-1.5-8-6-8-11v-6L12 2z" />
        <path d="M9 12l2 2 4-4" />
      </>
    ),
  },
  {
    titulo: "Mi perfil",
    descripcion: "Perfiles de juego, roles y personajes",
    path: "/app/perfil",
    icono: icono(
      <>
        <path d="M20 21v-2a4 4 0 0 0-4-4H8a4 4 0 0 0-4 4v2" />
        <circle cx="12" cy="7" r="4" />
      </>
    ),
  },
  {
    titulo: "Mi cuenta",
    descripcion: "Datos personales, avatar y contraseña",
    path: "/app/cuenta",
    icono: icono(
      <>
        <circle cx="12" cy="12" r="3" />
        <path d="M12 2v3M12 19v3M4.2 4.2l2.1 2.1M17.7 17.7l2.1 2.1M2 12h3M19 12h3M4.2 19.8l2.1-2.1M17.7 6.3l2.1-2.1" />
      </>
    ),
  },
];

// El perfil "principal" es el de mejor rango: define la portada de la cabecera.
function elegirPerfilPrincipal(perfiles) {
  return perfiles.reduce((mejor, actual) => {
    const valorMejor = rolConMejorRango(mejor)?.rank.value ?? -1;
    const valorActual = rolConMejorRango(actual)?.rank.value ?? -1;
    return valorActual > valorMejor ? actual : mejor;
  }, perfiles[0]);
}

const HomePage = () => {
  const { user } = useAuth();
  const { equipo, cargando, error } = useMiEquipo();
  const { games, isLoading: cargandoJuegos } = useGames();

  const perfiles = user?.profiles ?? [];
  const perfilPrincipal =
    perfiles.length > 0 ? elegirPerfilPrincipal(perfiles) : null;

  return (
    <section className="min-h-full bg-ganker-bg px-4 py-6 sm:px-6 lg:px-8">
      <div className="mx-auto w-full max-w-6xl space-y-6">
        <BienvenidaInicioComponent
          user={user}
          perfilPrincipal={perfilPrincipal}
        />

        <div className="grid items-start gap-6 lg:grid-cols-3">
          <div className="lg:col-span-2">
            <section>
              <div className="mb-3 flex items-center justify-between">
                <h2 className="font-heading text-xl font-semibold text-ganker-text">
                  Mis perfiles de juego
                </h2>
                <Link
                  to="/app/perfil"
                  className="text-sm font-semibold text-ganker-purple-light hover:underline"
                >
                  Gestionar →
                </Link>
              </div>

              {perfiles.length > 0 ? (
                <div className="grid gap-4 sm:grid-cols-2">
                  {perfiles.map((perfil) => (
                    <PerfilJuegoCardComponent
                      key={perfil.game_profile_id}
                      perfil={perfil}
                    />
                  ))}
                </div>
              ) : (
                <div className="rounded-2xl border border-dashed border-white/15 bg-ganker-surface p-8 text-center">
                  <p className="font-heading text-lg font-semibold text-ganker-text">
                    Todavía no tenés perfiles de juego
                  </p>
                  <p className="mx-auto mt-1 max-w-md text-sm text-ganker-muted">
                    Cargá tu juego, tus roles y tu rango para que otros
                    jugadores y equipos te encuentren.
                  </p>
                  <Link
                    to="/app/perfil"
                    className="mt-5 inline-flex rounded-xl bg-gradient-to-r from-ganker-orange to-ganker-purple px-5 py-2.5 font-heading text-sm font-bold tracking-wide text-ganker-text uppercase transition hover:brightness-110"
                  >
                    Crear perfil de juego
                  </Link>
                </div>
              )}
            </section>
            {!cargandoJuegos && games.length > 0 && (
              <section className="mt-6">
                <h2 className="mb-3 font-heading text-xl font-semibold text-ganker-text">
                  Juegos en Ganker
                </h2>
                <ul className="grid grid-cols-2 gap-4">
                  {games.map((juego) => (
                    <li key={juego.id}>
                      <Link
                        to="/app/equipos"
                        aria-label={`Equipos de ${juego.name}`}
                        className="group block rounded-2xl border border-white/10 transition hover:border-ganker-purple-light/50"
                      >
                        <FondoJuegoComponent
                          nombreJuego={juego.name}
                          className="h-24 rounded-2xl"
                        >
                          <div className="flex h-full items-end p-3">
                            <span className="font-heading text-sm font-bold text-ganker-text drop-shadow sm:text-base">
                              {juego.name}
                            </span>
                          </div>
                        </FondoJuegoComponent>
                      </Link>
                    </li>
                  ))}
                </ul>
              </section>
            )}
          </div>

          <aside className="space-y-6">
            <MiEquipoResumenComponent
              equipo={equipo}
              cargando={cargando}
              error={error}
            />
            <AccesosInicioComponent accesos={ACCESOS} />
          </aside>
        </div>
      </div>
    </section>
  );
};

export default HomePage;
