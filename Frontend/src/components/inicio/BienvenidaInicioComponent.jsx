import { Link } from "react-router-dom";
import FondoJuegoComponent from "./FondoJuegoComponent";
import { urlDeMedia } from "../../utils/media";
import { rolConMejorRango } from "../../utils/juegos";

// Cabecera del inicio del jugador, estilo "summoner header" de OP.GG: avatar,
// nombre y el rango principal sobre la portada de su juego principal.
function BienvenidaInicioComponent({ user, perfilPrincipal }) {
  const nombreJuego = perfilPrincipal?.videogame?.name;
  const mejorRol = rolConMejorRango(perfilPrincipal);
  const avatar = urlDeMedia(user?.icon_url);

  return (
    <FondoJuegoComponent
      nombreJuego={nombreJuego}
      className="rounded-2xl border border-white/10"
    >
      <div className="flex flex-col gap-6 p-6 sm:p-8 md:flex-row md:items-end md:justify-between">
        <div className="flex items-center gap-4 sm:gap-5">
          {avatar ? (
            <img
              src={avatar}
              alt={`Avatar de ${user?.username ?? "jugador"}`}
              className="h-20 w-20 shrink-0 rounded-2xl border-2 border-ganker-purple-light/60 object-cover shadow-[0_0_20px] shadow-ganker-purple/40 sm:h-24 sm:w-24"
            />
          ) : (
            <div className="flex h-20 w-20 shrink-0 items-center justify-center rounded-2xl border-2 border-ganker-purple-light/60 bg-ganker-surface-light font-heading text-3xl font-bold text-ganker-text sm:h-24 sm:w-24">
              {(user?.username ?? "?").charAt(0).toUpperCase()}
            </div>
          )}

          <div className="min-w-0">
            <p className="text-xs font-semibold tracking-[0.15em] text-ganker-purple-light uppercase">
              Bienvenido de nuevo
            </p>
            <h1 className="mt-1 truncate font-heading text-3xl font-bold text-ganker-text sm:text-4xl">
              {user?.username ?? "Jugador"}
            </h1>
            {nombreJuego ? (
              <p className="mt-1 flex flex-wrap items-center gap-x-2 text-sm text-ganker-muted">
                <span className="font-semibold text-ganker-text">
                  {nombreJuego}
                </span>
                {mejorRol && (
                  <>
                    <span aria-hidden="true">·</span>
                    <span className="inline-flex items-center gap-1.5">
                      <img
                        src={urlDeMedia(mejorRol.rank.icon_url)}
                        alt=""
                        aria-hidden="true"
                        className="h-5 w-5 object-contain"
                      />
                      {mejorRol.rank.name}
                    </span>
                  </>
                )}
              </p>
            ) : (
              <p className="mt-1 text-sm text-ganker-muted">
                Creá tu primer perfil de juego para empezar a encontrar equipo.
              </p>
            )}
          </div>
        </div>

        <div className="flex flex-wrap gap-3">
          <Link
            to="/app/jugadores"
            className="inline-flex items-center justify-center rounded-xl bg-gradient-to-r from-ganker-orange to-ganker-purple px-5 py-2.5 font-heading text-sm font-bold tracking-wide text-ganker-text uppercase transition hover:brightness-110"
          >
            Buscar jugadores
          </Link>
          <Link
            to="/app/equipos"
            className="inline-flex items-center justify-center rounded-xl border border-white/15 bg-ganker-bg/60 px-5 py-2.5 font-heading text-sm font-bold tracking-wide text-ganker-text uppercase backdrop-blur transition hover:border-ganker-purple-light/60"
          >
            Buscar equipos
          </Link>
        </div>
      </div>
    </FondoJuegoComponent>
  );
}

export default BienvenidaInicioComponent;
