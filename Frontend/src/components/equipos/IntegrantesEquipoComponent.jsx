import { urlDeMedia } from "../../utils/media";

const CLASES_ETIQUETA = "shrink-0 rounded-full border font-semibold";

// Lista los lugares del equipo (TeamSummaryResponse.members): ocupados por
// un jugador o vacantes. Las vacantes vienen con username "Libre" y el rol
// buscado en active_game_profile.active_role_profile.
//
// onExpulsar es opcional: la pagina solo lo pasa si quien mira es el lider.
// El boton no aparece en las vacantes ni en la fila del lider, asi el lider
// no puede elegirse a si mismo (el backend tambien lo rechaza).
//
// `compacto`: renglones de una sola linea, para las tarjetas de Buscar
// equipos (US 17) donde entran varios equipos por pantalla.
const IntegrantesEquipoComponent = ({
  integrantes,
  onExpulsar,
  compacto = false,
}) => {
  const tamanioAvatar = compacto ? "h-7 w-7" : "h-10 w-10";
  const tamanioEtiqueta = compacto
    ? "px-2 py-0.5 text-[11px]"
    : "px-3 py-1 text-xs";

  return (
    <ul className="divide-y divide-white/10 overflow-hidden rounded-xl border border-white/10">
      {integrantes.map((integrante, indice) => {
        const perfilRol = integrante.active_game_profile.active_role_profile;
        const iconUrl = urlDeMedia(integrante.icon_url);
        const rango = !integrante.is_vacant && perfilRol.rank_name?.trim();
        // Las vacantes muestran solo el rol buscado: la etiqueta "Disponible"
        // ya indica que el lugar esta libre.
        const detalle = integrante.is_vacant
          ? null
          : `${perfilRol.role_name}${rango ? ` · ${rango}` : ""}`;
        const nombre = integrante.is_vacant
          ? perfilRol.role_name
          : integrante.username;
        const colorNombre = integrante.is_vacant
          ? "text-ganker-muted"
          : "text-ganker-text";

        return (
          <li
            key={integrante.team_member_role_id ?? `lugar-${indice}`}
            className={`flex items-center justify-between bg-ganker-surface-light ${
              compacto ? "gap-2 px-3 py-1.5" : "gap-4 px-4 py-3"
            }`}
          >
            <div
              className={`flex min-w-0 items-center ${compacto ? "gap-2" : "gap-3"}`}
            >
              {iconUrl ? (
                <img
                  src={iconUrl}
                  alt=""
                  className={`${tamanioAvatar} shrink-0 rounded-full border border-white/10 object-cover ${
                    integrante.is_vacant ? "opacity-40" : ""
                  }`}
                  onError={(e) => {
                    e.currentTarget.style.visibility = "hidden";
                  }}
                />
              ) : (
                <div
                  className={`${tamanioAvatar} shrink-0 rounded-full border border-dashed border-white/20`}
                />
              )}

              {compacto ? (
                <p className="min-w-0 truncate text-sm">
                  <span className={`font-medium ${colorNombre}`}>{nombre}</span>
                  {detalle && (
                    <span className="text-xs text-ganker-muted">
                      {" "}
                      · {detalle}
                    </span>
                  )}
                </p>
              ) : (
                <div className="min-w-0">
                  <p className={`truncate font-medium ${colorNombre}`}>
                    {nombre}
                  </p>
                  {detalle && (
                    <p className="truncate text-xs text-ganker-muted">
                      {detalle}
                    </p>
                  )}
                </div>
              )}
            </div>

            {integrante.is_leader && (
              <span
                className={`${CLASES_ETIQUETA} ${tamanioEtiqueta} border-ganker-orange/30 bg-ganker-orange/10 text-ganker-orange-light`}
              >
                Líder
              </span>
            )}

            {integrante.is_vacant && (
              <span
                className={`${CLASES_ETIQUETA} ${tamanioEtiqueta} border-ganker-success/30 bg-ganker-success/10 text-ganker-success`}
              >
                Disponible
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
};

export default IntegrantesEquipoComponent;
