import { urlDeMedia } from "../../utils/media";
import IconoChicoComponent from "../common/IconoChicoComponent";
import BotonReportarJugadorComponent from "../moderacion/BotonReportarJugadorComponent";

const CLASES_ETIQUETA = "shrink-0 rounded-full border font-semibold";

// Lista los lugares del equipo (TeamSummaryResponse.members): ocupados por
// un jugador o vacantes. Las vacantes vienen con username "Libre" y el rol
// buscado en active_game_profile.active_role_profile.
//
// onExpulsar es opcional: la pagina solo lo pasa si quien mira es el lider.
// El boton no aparece en las vacantes ni en la fila del lider, asi el lider
// no puede elegirse a si mismo (el backend tambien lo rechaza).
// onTransferirLiderazgo (US 43) sigue la misma regla: solo lo pasa el lider
// y solo aparece en las filas de los otros integrantes.
//
// `compacto`: renglones de una sola linea, para las tarjetas de Buscar
// equipos (US 17) donde entran varios equipos por pantalla.
//
// `iconosDeRoles` ({ role_id: icon_url }, opcional): el backend no manda el
// icono del rol de cada integrante, asi que la pagina lo cruza con el
// catalogo de roles del juego (ver hooks/useIconosDeRoles.js). Sin el, la
// fila se muestra igual pero solo con el nombre del rol.
//
// `onVerPerfil(userId)` (opcional): si viene, el avatar y el nombre de cada
// integrante (no de las vacantes) llevan a su perfil.
//
// `currentUserId` (opcional): si viene, cada integrante que no sea el propio
// jugador tiene el boton de reporte (US 35). No se muestra en las vacantes
// ni en la version compacta de las tarjetas de busqueda.
function DetalleRolYRango({ perfilRol, iconoRol, rango }) {
  return (
    <span className="inline-flex min-w-0 items-center gap-1">
      <IconoChicoComponent src={iconoRol} className="h-4 w-4 shrink-0" />
      <span className="truncate">{perfilRol.role_name}</span>
      {rango && (
        <>
          <span aria-hidden="true">·</span>
          <IconoChicoComponent
            src={perfilRol.rank_icon_url}
            className="h-4 w-4 shrink-0"
          />
          <span className="truncate">{rango}</span>
        </>
      )}
    </span>
  );
}

const IntegrantesEquipoComponent = ({
  integrantes,
  onExpulsar,
  onTransferirLiderazgo,
  compacto = false,
  iconosDeRoles = {},
  onVerPerfil,
  currentUserId,
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
        const detalle = integrante.is_vacant ? null : (
          <DetalleRolYRango
            perfilRol={perfilRol}
            iconoRol={iconosDeRoles[perfilRol.role_id]}
            rango={rango}
          />
        );
        const nombre = integrante.is_vacant
          ? perfilRol.role_name
          : integrante.username;
        const colorNombre = integrante.is_vacant
          ? "text-ganker-muted"
          : "text-ganker-text";
        const puedeVerPerfil = Boolean(
          onVerPerfil && !integrante.is_vacant && integrante.user_id
        );
        const textoNombre = puedeVerPerfil ? (
          <button
            type="button"
            onClick={() => onVerPerfil(integrante.user_id)}
            title="Ver perfil"
            className="max-w-full cursor-pointer truncate text-left hover:underline"
          >
            {nombre}
          </button>
        ) : (
          nombre
        );

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
                  onClick={
                    puedeVerPerfil
                      ? () => onVerPerfil(integrante.user_id)
                      : undefined
                  }
                  className={`${tamanioAvatar} shrink-0 rounded-full border border-white/10 object-cover ${
                    integrante.is_vacant ? "opacity-40" : ""
                  } ${puedeVerPerfil ? "cursor-pointer hover:border-ganker-purple" : ""}`}
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
                <div className="flex min-w-0 items-center gap-1.5 text-sm">
                  <span className={`truncate font-medium ${colorNombre}`}>
                    {textoNombre}
                  </span>
                  {detalle && (
                    <span className="flex min-w-0 items-center gap-1.5 text-xs text-ganker-muted">
                      <span aria-hidden="true">·</span>
                      {detalle}
                    </span>
                  )}
                </div>
              ) : (
                <div className="min-w-0">
                  <p className={`truncate font-medium ${colorNombre}`}>
                    {textoNombre}
                  </p>
                  {detalle && (
                    <p className="mt-0.5 flex min-w-0 text-xs text-ganker-muted">
                      {detalle}
                    </p>
                  )}
                </div>
              )}
            </div>

            <div className="flex shrink-0 flex-wrap items-center justify-end gap-2">
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

              {!compacto &&
                !integrante.is_vacant &&
                currentUserId &&
                integrante.user_id !== currentUserId && (
                  <BotonReportarJugadorComponent
                    jugador={integrante}
                    currentUserId={currentUserId}
                    variante="icono"
                    soloIcono
                  />
                )}

              {(onTransferirLiderazgo || onExpulsar) &&
                !integrante.is_vacant &&
                !integrante.is_leader && (
                  <div className="flex shrink-0 items-center gap-2">
                    {onTransferirLiderazgo && (
                      <button
                        type="button"
                        onClick={() => onTransferirLiderazgo(integrante)}
                        className="cursor-pointer rounded-lg border border-ganker-purple-light/40 px-3 py-1.5 text-sm font-semibold text-ganker-purple-light transition hover:bg-ganker-purple/20 hover:text-ganker-text"
                      >
                        Hacer líder
                      </button>
                    )}
                    {onExpulsar && (
                      <button
                        type="button"
                        onClick={() => onExpulsar(integrante)}
                        className="cursor-pointer rounded-lg border border-ganker-error/40 px-3 py-1.5 text-sm font-semibold text-ganker-error transition hover:bg-ganker-error/10"
                      >
                        Expulsar
                      </button>
                    )}
                  </div>
                )}
            </div>
          </li>
        );
      })}
    </ul>
  );
};

export default IntegrantesEquipoComponent;
