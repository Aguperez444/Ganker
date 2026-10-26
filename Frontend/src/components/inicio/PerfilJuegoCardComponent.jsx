import { Link } from "react-router-dom";
import FondoJuegoComponent from "./FondoJuegoComponent";
import { urlDeMedia } from "../../utils/media";
import { rolConMejorRango } from "../../utils/juegos";

// Tarjeta de un perfil de juego en el inicio: portada del juego, rango
// principal grande (como el "ranked solo" de OP.GG) y los roles con su rango.
function PerfilJuegoCardComponent({ perfil }) {
  const mejorRol = rolConMejorRango(perfil);
  const roles = perfil.role_profiles ?? [];

  return (
    <Link
      to="/app/perfil"
      aria-label={`Perfil de ${perfil.videogame.name}`}
      className="group block rounded-2xl border border-white/10 bg-ganker-surface transition hover:border-ganker-purple-light/50 hover:shadow-[0_0_18px] hover:shadow-ganker-purple/30"
    >
      <FondoJuegoComponent
        nombreJuego={perfil.videogame.name}
        className="h-24 rounded-t-2xl"
      >
        <div className="flex h-full items-end justify-between gap-2 p-4">
          <div className="min-w-0">
            <h3 className="truncate font-heading text-lg font-bold text-ganker-text drop-shadow">
              {perfil.videogame.name}
            </h3>
            <p className="truncate text-xs text-ganker-muted">
              {perfil.in_game_name || "Sin nombre en el juego"}
              {perfil.region?.name && ` · ${perfil.region.name}`}
            </p>
          </div>
        </div>
      </FondoJuegoComponent>

      <div className="p-4">
        {mejorRol ? (
          <div className="flex items-center gap-3">
            <img
              src={urlDeMedia(mejorRol.rank.icon_url)}
              alt=""
              aria-hidden="true"
              className="h-14 w-14 object-contain drop-shadow-[0_0_8px_rgba(139,92,246,0.45)]"
            />
            <div>
              <p className="text-[11px] font-semibold tracking-wider text-ganker-muted uppercase">
                Rango principal
              </p>
              <p className="font-heading text-lg font-bold text-ganker-text">
                {mejorRol.rank.name}
              </p>
              <p className="text-xs text-ganker-purple-light">
                {mejorRol.role.name}
              </p>
            </div>
          </div>
        ) : (
          <p className="text-sm text-ganker-muted">Sin roles cargados.</p>
        )}

        {roles.length > 1 && (
          <ul className="mt-4 flex flex-wrap gap-2">
            {roles.map((rp) => (
              <li
                key={rp.role_profile_id}
                className="inline-flex items-center gap-1.5 rounded-lg border border-white/10 bg-ganker-surface-light px-2 py-1 text-xs text-ganker-text"
              >
                {rp.role.icon_url && (
                  <img
                    src={urlDeMedia(rp.role.icon_url)}
                    alt=""
                    aria-hidden="true"
                    className="h-4 w-4 object-contain"
                  />
                )}
                {rp.role.name}
                {rp.rank && (
                  <span className="text-ganker-muted"> · {rp.rank.name}</span>
                )}
              </li>
            ))}
          </ul>
        )}
      </div>
    </Link>
  );
}

export default PerfilJuegoCardComponent;
