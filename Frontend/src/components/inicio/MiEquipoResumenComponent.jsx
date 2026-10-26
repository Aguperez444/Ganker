import { Link } from "react-router-dom";
import { urlDeMedia } from "../../utils/media";

// Resumen del equipo del jugador en el inicio, o invitacion a crear/buscar
// uno si todavia no pertenece a ninguno.
function MiEquipoResumenComponent({ equipo, cargando, error }) {
  return (
    <section className="rounded-2xl border border-white/10 bg-ganker-surface p-5">
      <div className="flex items-center justify-between">
        <h2 className="font-heading text-lg font-semibold text-ganker-text">
          Mi equipo
        </h2>
        {equipo && (
          <Link
            to="/app/equipos/mi-equipo"
            className="text-sm font-semibold text-ganker-purple-light hover:underline"
          >
            Ver equipo →
          </Link>
        )}
      </div>

      {cargando ? (
        <p className="mt-4 text-sm text-ganker-muted">Cargando tu equipo...</p>
      ) : error ? (
        <p className="mt-4 text-sm text-ganker-error">{error}</p>
      ) : equipo ? (
        <div className="mt-4">
          <div className="flex items-center gap-3">
            {equipo.icon_url ? (
              <img
                src={urlDeMedia(equipo.icon_url)}
                alt=""
                aria-hidden="true"
                className="h-12 w-12 rounded-xl object-cover"
              />
            ) : (
              <div className="flex h-12 w-12 items-center justify-center rounded-xl bg-ganker-surface-light font-heading text-lg font-bold text-ganker-text">
                {equipo.team_name.charAt(0).toUpperCase()}
              </div>
            )}
            <div className="min-w-0">
              <p className="truncate font-heading font-bold text-ganker-text">
                {equipo.team_name}
              </p>
              <p className="text-xs text-ganker-muted">
                {equipo.videogame?.name ?? "Videojuego"} · {equipo.player_count}
                /{equipo.max_players} jugadores
              </p>
            </div>
            {equipo.representative_rank && (
              <img
                src={urlDeMedia(equipo.representative_rank.icon_url)}
                alt={`Rango representativo: ${equipo.representative_rank.name}`}
                title={equipo.representative_rank.name}
                className="ml-auto h-10 w-10 object-contain"
              />
            )}
          </div>

          <div className="mt-4 h-2 overflow-hidden rounded-full bg-ganker-surface-light">
            <div
              className="h-full rounded-full bg-gradient-to-r from-ganker-orange to-ganker-purple-light"
              style={{
                width: `${Math.min(100, (equipo.player_count / Math.max(1, equipo.max_players)) * 100)}%`,
              }}
            />
          </div>

          <ul className="mt-4 flex -space-x-2">
            {(equipo.members ?? [])
              .filter((m) => !m.is_vacant)
              .map((m) => (
                <li key={m.user_id}>
                  <img
                    src={urlDeMedia(m.icon_url)}
                    alt={m.username}
                    title={m.is_leader ? `${m.username} (líder)` : m.username}
                    className={`h-9 w-9 rounded-full border-2 object-cover ${
                      m.is_leader
                        ? "border-ganker-orange"
                        : "border-ganker-surface"
                    }`}
                  />
                </li>
              ))}
          </ul>
        </div>
      ) : (
        <div className="mt-4">
          <p className="text-sm text-ganker-muted">
            Todavía no estás en un equipo. Armá el tuyo o sumate a uno que
            busque tu rol.
          </p>
          <div className="mt-4 flex flex-wrap gap-2">
            <Link
              to="/app/equipos/crear"
              className="rounded-xl bg-ganker-purple px-4 py-2 text-sm font-semibold text-ganker-text transition hover:brightness-110"
            >
              Crear equipo
            </Link>
            <Link
              to="/app/equipos"
              className="rounded-xl border border-white/10 bg-ganker-surface-light px-4 py-2 text-sm font-semibold text-ganker-text transition hover:border-ganker-purple-light/50"
            >
              Buscar equipos
            </Link>
          </div>
        </div>
      )}
    </section>
  );
}

export default MiEquipoResumenComponent;
