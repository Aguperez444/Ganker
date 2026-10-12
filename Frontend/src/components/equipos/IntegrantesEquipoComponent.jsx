import { urlDeMedia } from "../../utils/media";

// Lista los lugares del equipo (TeamSummaryResponse.members): ocupados por
// un jugador o vacantes. Las vacantes vienen con username "Libre" y el rol
// buscado en active_game_profile.active_role_profile.
//
// onExpulsar es opcional: la pagina solo lo pasa si quien mira es el lider.
// El boton no aparece en las vacantes ni en la fila del lider, asi el lider
// no puede elegirse a si mismo (el backend tambien lo rechaza).
const IntegrantesEquipoComponent = ({ integrantes, onExpulsar }) => (
  <ul className="divide-y divide-white/10 overflow-hidden rounded-xl border border-white/10">
    {integrantes.map((integrante, indice) => {
      const perfilRol = integrante.active_game_profile.active_role_profile;
      const iconUrl = urlDeMedia(integrante.icon_url);

      return (
        <li
          key={integrante.team_member_role_id ?? `lugar-${indice}`}
          className="flex items-center justify-between gap-4 bg-ganker-surface-light px-4 py-3"
        >
          <div className="flex min-w-0 items-center gap-3">
            {iconUrl ? (
              <img
                src={iconUrl}
                alt=""
                className={`h-10 w-10 shrink-0 rounded-full border border-white/10 object-cover ${
                  integrante.is_vacant ? "opacity-40" : ""
                }`}
                onError={(e) => {
                  e.currentTarget.style.visibility = "hidden";
                }}
              />
            ) : (
              <div className="h-10 w-10 shrink-0 rounded-full border border-dashed border-white/20" />
            )}

            <div className="min-w-0">
              <p
                className={`truncate font-medium ${
                  integrante.is_vacant
                    ? "text-ganker-muted"
                    : "text-ganker-text"
                }`}
              >
                {integrante.is_vacant ? "Cupo vacante" : integrante.username}
              </p>
              <p className="truncate text-xs text-ganker-muted">
                {perfilRol.role_name}
                {!integrante.is_vacant && perfilRol.rank_name
                  ? ` · ${perfilRol.rank_name}`
                  : ""}
              </p>
            </div>
          </div>

          {integrante.is_leader && (
            <span className="shrink-0 rounded-full border border-ganker-orange/30 bg-ganker-orange/10 px-3 py-1 text-xs font-semibold text-ganker-orange-light">
              Líder
            </span>
          )}

          {onExpulsar && !integrante.is_vacant && !integrante.is_leader && (
            <button
              type="button"
              onClick={() => onExpulsar(integrante)}
              className="shrink-0 cursor-pointer rounded-lg px-3 py-2 text-sm font-semibold text-ganker-error transition hover:bg-ganker-error/10"
            >
              Expulsar
            </button>
          )}
        </li>
      );
    })}
  </ul>
);

export default IntegrantesEquipoComponent;
