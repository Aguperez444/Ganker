import AvatarUsuarioComponent from "../common/AvatarUsuarioComponent";
import { urlDeMedia } from "../../utils/media";

// Icono del catálogo (rango, rol, equipo) que se oculta si la imagen falla,
// dejando que el resto del contenido (nombres, badges) siga siendo legible.
function IconoCatalogo({ ruta, className = "h-5 w-5" }) {
  const url = urlDeMedia(ruta);
  if (!url) return null;

  return (
    <img
      src={url}
      alt=""
      className={`${className} shrink-0 rounded object-cover`}
      onError={(e) => {
        e.currentTarget.style.display = "none";
      }}
    />
  );
}

function AvatarMiembro({ miembro }) {
  return (
    <span className="flex h-8 w-8 shrink-0 items-center justify-center overflow-hidden rounded-full bg-ganker-surface-light text-xs font-semibold text-ganker-purple-light">
      <AvatarUsuarioComponent user={miembro} />
    </span>
  );
}

// Una tarjeta de equipo del listado de búsqueda. Muestra los datos del equipo
// (nombre, descripción, rango representativo, mín/máx, videojuego, región,
// contador de jugadores), su roster (ocupados y vacantes) y la posibilidad de
// unirse según consultant_player_info que ya calcula el backend.
//
// Props:
//   - equipo: TeamSummaryResponse tal cual lo devuelve GET /api/v1/teams.
//   - procesandoUnirse: true mientras se procesa el pedido de unirse.
//   - onBotonUnirse: botón principal "Unirse al equipo" (la página decide si
//     une directo — vacante única — o abre el selector de rol).
//   - onUnirseVacante: botón de una vacante puntual del roster.
function EquipoCardComponent({
  equipo,
  procesandoUnirse = false,
  onBotonUnirse,
  onUnirseVacante,
}) {
  const miembros = equipo.members ?? [];
  const vacantes = miembros.filter((miembro) => miembro.is_vacant);
  const ocupados = miembros.filter((miembro) => !miembro.is_vacant);

  const infoConsulta = equipo.consultant_player_info;
  const puedeUnirse = Boolean(infoConsulta?.join_eligibility?.can_join);
  const motivo = infoConsulta?.join_eligibility?.reason;
  const esMiembro = Boolean(infoConsulta?.is_member);

  const iconoEquipo = urlDeMedia(equipo.icon_url);

  return (
    <article
      data-testid={`equipo-${equipo.team_id}`}
      className="flex flex-col rounded-2xl border border-white/10 bg-ganker-surface p-5 transition hover:border-ganker-purple/30"
    >
      {/* Encabezado: ícono + nombre + videojuego */}
      <header className="flex items-start gap-3">
        {iconoEquipo ? (
          <img
            src={iconoEquipo}
            alt=""
            className="h-12 w-12 shrink-0 rounded-xl object-cover"
            onError={(e) => {
              e.currentTarget.style.display = "none";
            }}
          />
        ) : null}

        <div className="min-w-0">
          <h3 className="truncate font-heading text-lg font-bold text-ganker-text">
            {equipo.team_name}
          </h3>
          <p className="truncate text-sm text-ganker-muted">
            {equipo.videogame?.name ?? "Videojuego"}
            {equipo.region?.region_name ? ` · ${equipo.region.region_name}` : ""}
          </p>
        </div>

        {esMiembro && (
          <span className="ml-auto shrink-0 rounded-full border border-ganker-purple/40 bg-ganker-purple/15 px-2.5 py-1 text-xs font-semibold text-ganker-purple-light">
            Sos miembro
          </span>
        )}
      </header>

      {/* Descripción */}
      {equipo.description && (
        <p className="mt-3 line-clamp-2 text-sm text-ganker-muted">
          {equipo.description}
        </p>
      )}

      {/* Contador de jugadores + vacantes */}
      <div className="mt-3 flex flex-wrap items-center gap-2 text-xs">
        <span className="rounded-full border border-white/10 bg-ganker-surface-light px-2.5 py-1 font-semibold text-ganker-text">
          {equipo.player_count}/{equipo.max_players} jugadores
        </span>

        {vacantes.length > 0 && (
          <span className="rounded-full border border-ganker-purple/30 bg-ganker-purple/10 px-2.5 py-1 font-semibold text-ganker-purple-light">
            {vacantes.length} vacante{vacantes.length > 1 ? "s" : ""}
          </span>
        )}

        {equipo.allow_other_regions && (
          <span className="rounded-full border border-white/10 bg-ganker-surface-light px-2.5 py-1 text-ganker-muted">
            Acepta jugadores de otras regiones
          </span>
        )}
      </div>

      {/* Rangos */}
      <div className="mt-3 flex flex-wrap items-center gap-x-4 gap-y-1 text-sm text-ganker-muted">
        {equipo.representative_rank && (
          <span className="flex items-center gap-1.5 text-ganker-text">
            <IconoCatalogo ruta={equipo.representative_rank.icon_url} />
            <span className="font-semibold">
              {equipo.representative_rank.name}
            </span>
            <span className="text-xs text-ganker-muted">
              (rango del equipo)
            </span>
          </span>
        )}

        {equipo.min_rank && equipo.max_rank && (
          <span className="flex items-center gap-1.5">
            <IconoCatalogo ruta={equipo.min_rank.icon_url} />
            <span>
              {equipo.min_rank.name} – {equipo.max_rank.name}
            </span>
            <IconoCatalogo ruta={equipo.max_rank.icon_url} />
          </span>
        )}
      </div>

      {/* Roster */}
      <ul className="mt-4 space-y-2">
        {ocupados.map((miembro) => (
          <li
            key={miembro.team_member_role_id ?? miembro.user_id}
            className="flex items-center gap-3 rounded-xl border border-white/5 bg-ganker-surface-light px-3 py-2"
          >
            <AvatarMiembro miembro={miembro} />
            <div className="min-w-0">
              <p className="truncate text-sm font-semibold text-ganker-text">
                {miembro.name}
              </p>
              <p className="truncate text-xs text-ganker-muted">
                {miembro.active_game_profile?.active_role_profile?.role_name ??
                  "Sin rol"}
              </p>
            </div>

            {miembro.is_leader && (
              <span className="ml-auto shrink-0 rounded-full border border-amber-400/30 bg-amber-400/10 px-2.5 py-1 text-xs font-semibold text-amber-300">
                Líder
              </span>
            )}
          </li>
        ))}

        {vacantes.map((vacante) => {
          const rol = vacante.active_game_profile?.active_role_profile;

          return (
            <li
              key={vacante.team_member_role_id}
              className="flex items-center gap-3 rounded-xl border border-dashed border-ganker-purple/40 bg-ganker-purple/5 px-3 py-2"
            >
              <IconoCatalogo ruta={vacante.icon_url} className="h-8 w-8" />
              <div className="min-w-0">
                <p className="truncate text-sm font-semibold text-ganker-text">
                  Vacante de {rol?.role_name ?? "rol libre"}
                </p>
                <p className="truncate text-xs text-ganker-muted">Libre</p>
              </div>

              {puedeUnirse && (
                <button
                  type="button"
                  onClick={() => onUnirseVacante(vacante)}
                  disabled={procesandoUnirse}
                  className="ml-auto shrink-0 cursor-pointer rounded-lg border border-ganker-purple/40 bg-ganker-purple/15 px-3 py-1.5 text-xs font-semibold text-ganker-purple-light transition hover:bg-ganker-purple/25 disabled:cursor-not-allowed disabled:opacity-50"
                >
                  {procesandoUnirse ? "Procesando..." : "Unirse"}
                </button>
              )}
            </li>
          );
        })}
      </ul>

      {/* Acción de la tarjeta */}
      <div className="mt-4 flex-1 flex items-end">
        {puedeUnirse ? (
          <button
            type="button"
            onClick={onBotonUnirse}
            disabled={procesandoUnirse}
            className="w-full cursor-pointer rounded-xl bg-ganker-purple px-4 py-2.5 text-sm font-bold text-white transition hover:bg-ganker-purple/80 disabled:cursor-not-allowed disabled:opacity-50"
          >
            {procesandoUnirse ? "Procesando..." : "Unirse al equipo"}
          </button>
        ) : motivo ? (
          <span className="w-full rounded-xl border border-ganker-error/20 bg-ganker-error/10 px-4 py-2.5 text-center text-sm font-medium text-ganker-error">
            {motivo}
          </span>
        ) : null}
      </div>
    </article>
  );
}

export default EquipoCardComponent;