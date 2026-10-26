import { Link } from "react-router-dom";
import { useAuth } from "../context/AuthContext";
import useMiEquipo from "../hooks/useMiEquipo";
import BienvenidaInicioComponent from "../components/inicio/BienvenidaInicioComponent";
import MiEquipoResumenComponent from "../components/inicio/MiEquipoResumenComponent";
import PerfilJuegoCardComponent from "../components/inicio/PerfilJuegoCardComponent";
import { rolConMejorRango } from "../utils/juegos";
import { obtenerIdUsuarioDesdeToken } from "../utils/jwt";

// El perfil "principal" es el de mejor rango: define la portada de la cabecera.
function elegirPerfilPrincipal(perfiles) {
  return perfiles.reduce((mejor, actual) => {
    const valorMejor = rolConMejorRango(mejor)?.rank.value ?? -1;
    const valorActual = rolConMejorRango(actual)?.rank.value ?? -1;
    return valorActual > valorMejor ? actual : mejor;
  }, perfiles[0]);
}

const HomePage = () => {
  const { user, tokens } = useAuth();
  // /me no devuelve el id: sale del token, como en ModeracionPage.
  const miId = obtenerIdUsuarioDesdeToken(tokens?.access_token);
  const { equipo } = useMiEquipo();

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

        {/* El resumen de Mi equipo solo existe si el jugador está en un
        equipo; sin él, los perfiles ocupan todo el ancho. */}
        <div
          className={`grid items-start gap-6 ${equipo ? "lg:grid-cols-3" : ""}`}
        >
          <div className={equipo ? "lg:col-span-2" : ""}>
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
                      jugadorId={miId}
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
          </div>

          {equipo && (
            <aside>
              <MiEquipoResumenComponent equipo={equipo} />
            </aside>
          )}
        </div>
      </div>
    </section>
  );
};

export default HomePage;
