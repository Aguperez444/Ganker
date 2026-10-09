import { urlDeMedia } from "../../utils/media";
import Dato from "./DatoEquipoComponent";

// Cabecera de la vista de un equipo (TeamSummaryResponse): icono, nombre,
// ocupacion, mensaje de busqueda y las condiciones para unirse.
const FichaEquipoComponent = ({ equipo }) => {
  const iconUrl = urlDeMedia(equipo.icon_url);
  const rangoPermitido =
    equipo.min_rank?.rank_id === equipo.max_rank?.rank_id
      ? equipo.min_rank?.name
      : `${equipo.min_rank?.name} a ${equipo.max_rank?.name}`;

  return (
    <div className="rounded-2xl border border-white/10 bg-ganker-surface p-5 sm:p-6">
      <div className="flex items-center gap-4">
        {iconUrl && (
          <img
            src={iconUrl}
            alt=""
            className="h-16 w-16 shrink-0 rounded-xl border border-white/10 object-cover"
            onError={(e) => {
              e.currentTarget.style.display = "none";
            }}
          />
        )}
        <div className="min-w-0">
          <h2 className="truncate font-heading text-2xl font-bold text-ganker-text">
            {equipo.team_name}
          </h2>
          <p className="text-sm text-ganker-muted">
            {equipo.videogame?.name} · {equipo.player_count}/
            {equipo.max_players} jugadores
          </p>
        </div>
      </div>

      {equipo.description && (
        <p className="mt-4 text-sm whitespace-pre-line text-ganker-text">
          {equipo.description}
        </p>
      )}

      <dl className="mt-5 grid gap-3 sm:grid-cols-3">
        <Dato
          etiqueta="Región"
          valor={equipo.region?.region_name ?? "Sin región"}
        />
        <Dato
          etiqueta="Otras regiones"
          valor={equipo.allow_other_regions ? "Se admiten" : "No se admiten"}
        />
        <Dato etiqueta="Rango permitido" valor={rangoPermitido} />
      </dl>
    </div>
  );
};

export default FichaEquipoComponent;
