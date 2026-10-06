import AvatarUsuarioComponent from "../common/AvatarUsuarioComponent";
import { urlDeMedia } from "../../utils/media";
import { validarUnirseEquipo } from "../../utils/validacionesEquipos";

/**
 * Tarjeta de un equipo en el Lobby (US 01, US 02, US 03).
 */
export function EquipoCardComponent({
  team,
  user,
  ranks = [],
  estaEnEquipoActivo = false,
  onUnirse,
  onAbrirChat,
}) {
  const vacantes =
    team.members?.filter((m) => m.is_vacant || m.user_id === null) ?? [];
  const miembrosOcupados =
    team.members?.filter((m) => !m.is_vacant && m.user_id !== null) ?? [];

  const estaLleno =
    (team.player_count !== undefined &&
      team.max_players !== undefined &&
      team.player_count >= team.max_players) ||
    vacantes.length === 0;

  const consultantInfo = team.consultant_player_info;
  const joinEligibility =
    consultantInfo?.join_eligibility ?? team.join_eligibility;

  const esMiembro =
    consultantInfo?.is_member ??
    Boolean(
      user &&
      miembrosOcupados.some(
        (m) =>
          m.user_id === user.user_id ||
          m.username === user.username ||
          m.name === user.name
      )
    );

  const videogameName = team.videogame?.name || team.videogame_name;
  const regionName = team.region?.region_name || team.region_name;
  const minRankName = team.min_rank?.name || team.min_rank_name;
  const maxRankName = team.max_rank?.name || team.max_rank_name;

  // Rango representativo de la sala:
  const rangoRepresentativo = (() => {
    if (team.representative_rank?.name) {
      return {
        name: team.representative_rank.name,
        icon_url: team.representative_rank.icon_url,
      };
    }
    if (minRankName && maxRankName) {
      const name =
        minRankName === maxRankName
          ? minRankName
          : `${minRankName} - ${maxRankName}`;
      return { name, icon_url: null };
    }
    const primerRango =
      miembrosOcupados[0]?.active_game_profile?.active_role_profile?.rank_name;
    return { name: primerRango || "Sin rango especificado", icon_url: null };
  })();

  // Comprobar si el usuario cumple con los requisitos para unirse a alguna vacante
  const evaluacionRequisitos = (() => {
    if (!user || esMiembro || estaLleno) return null;

    // Si el backend envió join_eligibility (v2 o anidado en consultant_player_info v3), usarlo prioritariamente
    if (joinEligibility) {
      return {
        cumple: Boolean(joinEligibility.can_join),
        motivo:
          joinEligibility.reason ||
          (joinEligibility.can_join
            ? "Cumples los requisitos"
            : "No cumples con los requisitos del equipo"),
      };
    }

    if (estaEnEquipoActivo) {
      return { cumple: false, motivo: "Ya tienes un equipo activo." };
    }

    // Verificar si cumple para al menos una de las vacantes
    let cumpleAlguna = false;
    let primerMotivo = "";

    for (const v of vacantes) {
      const roleId = v.active_game_profile?.active_role_profile?.role_id;
      const res = validarUnirseEquipo({
        team,
        user,
        targetRoleId: roleId,
        ranks,
        estaEnEquipoActivo,
      });

      if (res.esValido) {
        cumpleAlguna = true;
        break;
      } else if (!primerMotivo) {
        primerMotivo = res.error;
      }
    }

    return {
      cumple: cumpleAlguna,
      motivo: cumpleAlguna ? "Cumples los requisitos" : primerMotivo,
    };
  })();

  return (
    <div
      data-testid={`equipo-card-${team.team_id}`}
      className="flex flex-col justify-between rounded-2xl border border-white/10 bg-ganker-surface p-5 transition hover:border-ganker-purple/40 sm:p-6"
    >
      <div>
        {/* Cabecera de la sala: Avatar del equipo, Nombre, juego y contador */}
        <div className="flex items-start justify-between gap-3">
          <div className="flex items-center gap-3 min-w-0">
            <div className="flex h-12 w-12 shrink-0 items-center justify-center overflow-hidden rounded-xl border border-ganker-purple/40 bg-ganker-purple/10 text-xl font-bold text-ganker-purple-light">
              {team.icon_url ? (
                <img
                  src={urlDeMedia(team.icon_url)}
                  alt={team.team_name}
                  className="h-full w-full object-cover"
                  onError={(e) => {
                    e.currentTarget.style.display = "none";
                  }}
                />
              ) : (
                <span>🛡️</span>
              )}
            </div>

            <div className="min-w-0">
              <h3 className="truncate font-heading text-lg font-bold text-ganker-text sm:text-xl">
                {team.team_name}
              </h3>

              <div className="mt-1 flex flex-wrap items-center gap-2 text-xs text-ganker-muted">
                {videogameName && (
                  <span className="inline-flex items-center rounded-md border border-white/10 bg-ganker-surface-light px-2 py-0.5 font-medium text-ganker-purple-light">
                    {videogameName}
                  </span>
                )}

                <span className="inline-flex items-center rounded-md border border-white/10 bg-white/5 px-2 py-0.5 text-ganker-muted">
                  {team.allow_other_regions
                    ? "Cualquier región"
                    : regionName
                      ? `Región: ${regionName}`
                      : "Región local"}
                </span>
              </div>
            </div>
          </div>

          {/* Contador de jugadores (ej: 4/5) */}
          <div className="shrink-0 rounded-xl border border-ganker-purple/30 bg-ganker-purple/10 px-3 py-1.5 text-center">
            <span className="font-heading text-sm font-bold text-ganker-purple-light sm:text-base">
              {team.player_count}/{team.max_players}
            </span>
            <p className="text-[10px] text-ganker-muted uppercase tracking-wider">
              Miembros
            </p>
          </div>
        </div>

        {/* Mensaje descriptivo / búsqueda de sala */}
        {team.description && (
          <p className="mt-3 text-sm italic text-ganker-text/80 line-clamp-2">
            &ldquo;{team.description}&rdquo;
          </p>
        )}

        {/* Rango representativo de la sala */}
        <div className="mt-4 flex items-center gap-2 rounded-xl border border-white/5 bg-ganker-surface-light/50 px-3 py-2 text-xs">
          <span className="font-semibold text-ganker-muted">Rango:</span>
          {rangoRepresentativo.icon_url && (
            <img
              src={urlDeMedia(rangoRepresentativo.icon_url)}
              alt=""
              className="h-4 w-4 object-contain"
            />
          )}
          <span className="font-medium text-ganker-text">
            {rangoRepresentativo.name}
          </span>
        </div>

        {/* Integrantes actuales y espacios vacantes */}
        <div className="mt-4 space-y-2">
          <p className="text-xs font-semibold text-ganker-muted uppercase tracking-wider">
            Roster del equipo
          </p>

          <div className="grid gap-2">
            {team.members?.map((member, index) => {
              const esVacante = member.is_vacant || member.user_id === null;
              const roleProfile =
                member.active_game_profile?.active_role_profile;
              const roleName = roleProfile?.role_name || "Rol libre";
              const rankName = roleProfile?.rank_name || "";
              const rankIcon = roleProfile?.rank_icon_url
                ? urlDeMedia(roleProfile.rank_icon_url)
                : null;
              const memberIcon = member.icon_url
                ? urlDeMedia(member.icon_url)
                : null;

              if (esVacante) {
                return (
                  <div
                    key={`vacant-${index}`}
                    className="flex items-center justify-between rounded-xl border border-dashed border-ganker-orange/30 bg-ganker-orange/5 px-3 py-2 text-xs text-ganker-orange"
                  >
                    <div className="flex items-center gap-2.5">
                      <div className="flex h-7 w-7 items-center justify-center rounded-lg border border-ganker-orange/40 bg-ganker-orange/10 text-xs">
                        {memberIcon ? (
                          <img
                            src={memberIcon}
                            alt=""
                            className="h-5 w-5 object-contain"
                          />
                        ) : (
                          <span>+</span>
                        )}
                      </div>
                      <span className="font-medium">
                        Cupo vacante — Rol:{" "}
                        <span className="font-bold">{roleName}</span>
                      </span>
                    </div>

                    <span className="rounded-full bg-ganker-orange/20 px-2 py-0.5 text-[10px] font-semibold uppercase">
                      Disponible
                    </span>
                  </div>
                );
              }

              // Miembro activo
              const esLider = member.is_leader ?? index === 0;

              return (
                <div
                  key={`member-${member.user_id || index}`}
                  className="flex items-center justify-between rounded-xl border border-white/5 bg-ganker-surface-light px-3 py-2 text-xs"
                >
                  <div className="flex min-w-0 items-center gap-2.5">
                    <div className="flex h-7 w-7 shrink-0 items-center justify-center overflow-hidden rounded-full border border-ganker-purple/40 bg-ganker-surface">
                      <AvatarUsuarioComponent user={member} />
                    </div>

                    <div className="min-w-0">
                      <div className="flex items-center gap-1.5">
                        <span className="truncate font-semibold text-ganker-text">
                          {member.name || member.username}
                        </span>
                        {esLider && (
                          <span className="rounded bg-ganker-purple/20 px-1 py-0.2 text-[9px] font-bold text-ganker-purple-light uppercase">
                            Líder
                          </span>
                        )}
                      </div>

                      <span className="truncate text-[11px] text-ganker-muted">
                        Rol: {roleName}
                      </span>
                    </div>
                  </div>

                  {rankName && (
                    <div className="flex shrink-0 items-center gap-1 text-[11px] text-ganker-muted">
                      {rankIcon && (
                        <img
                          src={rankIcon}
                          alt=""
                          className="h-4 w-4 object-contain"
                        />
                      )}
                      <span>{rankName}</span>
                    </div>
                  )}
                </div>
              );
            })}
          </div>
        </div>
      </div>

      {/* Botón de acción e indicador de requisitos */}
      <div className="mt-5 border-t border-white/10 pt-4">
        {evaluacionRequisitos && !evaluacionRequisitos.cumple && (
          <p className="mb-2 text-xs text-ganker-warning/90">
            ⚠️ {evaluacionRequisitos.motivo}
          </p>
        )}

        {esMiembro ? (
          <div className="flex items-center gap-2">
            <span className="flex-1 rounded-xl border border-ganker-success/30 bg-ganker-success/10 py-2.5 text-center text-xs font-semibold text-ganker-success">
              ✓ Eres integrante de este equipo
            </span>
            <button
              type="button"
              onClick={() => onAbrirChat?.(team)}
              className="cursor-pointer rounded-xl bg-gradient-to-r from-ganker-orange to-ganker-purple px-4 py-2.5 text-xs font-semibold text-white transition hover:opacity-90"
            >
              Chat
            </button>
          </div>
        ) : (
          <button
            type="button"
            onClick={() => onUnirse?.(team)}
            disabled={
              estaLleno ||
              (evaluacionRequisitos && !evaluacionRequisitos.cumple)
            }
            title={
              evaluacionRequisitos && !evaluacionRequisitos.cumple
                ? evaluacionRequisitos.motivo
                : undefined
            }
            className={`w-full rounded-xl px-4 py-2.5 text-sm font-semibold transition ${
              estaLleno ||
              (evaluacionRequisitos && !evaluacionRequisitos.cumple)
                ? "cursor-not-allowed border border-white/10 bg-white/5 text-ganker-muted"
                : "cursor-pointer bg-gradient-to-r from-ganker-orange to-ganker-purple text-white shadow-lg shadow-ganker-purple/20 hover:opacity-90"
            }`}
          >
            {estaLleno ? "Equipo completo" : "Unirse al equipo"}
          </button>
        )}
      </div>
    </div>
  );
}

export default EquipoCardComponent;
