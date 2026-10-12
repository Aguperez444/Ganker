import { Link } from "react-router-dom";
import { urlDeMedia } from "../../utils/media";
import IntegrantesEquipoComponent from "./IntegrantesEquipoComponent";

function Icono({ src, className }) {
  const url = urlDeMedia(src);
  if (!url) {
    return (
      <div
        className={`${className} border border-dashed border-white/20 bg-ganker-surface`}
      />
    );
  }
  return (
    <img
      src={url}
      alt=""
      className={`${className} object-cover`}
      onError={(e) => {
        e.currentTarget.style.visibility = "hidden";
      }}
    />
  );
}

// US 17 - Buscar equipos: un equipo del listado (TeamSummaryResponse) con
// nombre, descripcion, rango representativo, integrantes (avatar y rango) y
// vacantes (misma lista con contorno por renglon que Mi equipo) y contador. El boton "Unirse al equipo" (US 18) llama a onUnirse,
// que abre el modal donde se ve si el jugador cumple los requisitos.
const TarjetaEquipoComponent = ({ equipo, onUnirse }) => {
  const info = equipo.consultant_player_info;
  const rangoRepresentativo = equipo.representative_rank;
  const rangoPermitido =
    equipo.min_rank?.rank_id === equipo.max_rank?.rank_id
      ? equipo.min_rank?.name
      : `${equipo.min_rank?.name} a ${equipo.max_rank?.name}`;

  return (
    <article className="flex h-full flex-col rounded-2xl border border-white/10 bg-ganker-surface p-5">
      <div className="flex items-start gap-3">
        <Icono
          src={equipo.icon_url}
          className="h-12 w-12 shrink-0 rounded-lg border border-white/10"
        />
        <div className="min-w-0 flex-1">
          <Link
            to={`/app/equipos/${equipo.team_id}`}
            className="block truncate font-heading text-lg font-semibold text-ganker-text hover:underline"
          >
            {equipo.team_name}
          </Link>
          <p className="truncate text-xs text-ganker-muted">
            {equipo.region?.region_name ?? "Sin región"}
            {equipo.allow_other_regions ? " (admite otras)" : ""} · Rango{" "}
            {rangoPermitido}
          </p>
        </div>
        <span
          className="shrink-0 rounded-full bg-white/5 px-3 py-1 text-sm font-semibold text-ganker-text"
          aria-label={`${equipo.player_count} de ${equipo.max_players} jugadores`}
        >
          {equipo.player_count}/{equipo.max_players}
        </span>
      </div>

      {equipo.description && (
        <p className="mt-3 line-clamp-2 text-sm text-ganker-muted">
          {equipo.description}
        </p>
      )}

      {rangoRepresentativo && (
        <div className="mt-3 flex items-center gap-2 text-xs text-ganker-muted">
          <Icono src={rangoRepresentativo.icon_url} className="h-5 w-5" />
          <span>
            Rango representativo:{" "}
            <span className="font-semibold text-ganker-text">
              {rangoRepresentativo.name}
            </span>
          </span>
        </div>
      )}

      <div className="mt-3">
        <IntegrantesEquipoComponent integrantes={equipo.members} compacto />
      </div>

      <div className="mt-auto pt-5">
        {info?.is_member ? (
          <Link
            to="/app/equipos/mi-equipo"
            className="block w-full rounded-xl border border-white/10 px-4 py-2.5 text-center text-sm font-semibold text-ganker-text transition hover:bg-white/5"
          >
            Ver mi equipo
          </Link>
        ) : (
          <button
            type="button"
            onClick={() => onUnirse(equipo)}
            className="w-full cursor-pointer rounded-xl bg-gradient-to-r from-ganker-orange to-ganker-purple px-4 py-2.5 text-sm font-semibold text-white transition hover:opacity-90"
          >
            Unirse al equipo
          </button>
        )}
      </div>
    </article>
  );
};

export default TarjetaEquipoComponent;
