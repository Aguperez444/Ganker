import IconoChicoComponent from "../common/IconoChicoComponent";
import { formatearDuracion, formatearPuntos } from "../../utils/riot";
import { formatearTiempoRelativo } from "../../utils/tiempo";

const CLASES_TITULO =
  "text-xs font-semibold tracking-[0.15em] text-ganker-purple-light uppercase";
const CLASES_TARJETA =
  "rounded-xl border border-white/10 bg-ganker-surface-light p-4";

function Dato({ etiqueta, valor }) {
  return (
    <div>
      <p className="text-[11px] text-ganker-muted uppercase">{etiqueta}</p>
      <p className="font-heading text-lg font-semibold text-ganker-text">
        {valor}
      </p>
    </div>
  );
}

function RangoRiot({ entrada }) {
  return (
    <div className={CLASES_TARJETA}>
      <p className="text-xs text-ganker-muted">{entrada.queue}</p>
      <p className="mt-1 font-heading text-lg font-semibold text-ganker-text">
        {entrada.tier}
        {entrada.division ? ` ${entrada.division}` : ""}
        <span className="ml-2 text-sm font-normal text-ganker-muted">
          {entrada.league_points} LP
        </span>
      </p>
      <p className="mt-1 text-xs text-ganker-muted">
        {entrada.wins}V {entrada.losses}D · {entrada.winrate}%
      </p>
    </div>
  );
}

function PartidaRiot({ partida }) {
  return (
    <li
      className={`flex items-center gap-3 rounded-xl border-l-4 bg-ganker-surface-light px-3 py-2 ${
        partida.win ? "border-ganker-success" : "border-ganker-error"
      }`}
    >
      <IconoChicoComponent
        src={partida.champion_icon_url}
        alt={partida.champion_name}
        className="h-10 w-10 shrink-0 rounded-lg"
        placeholder
      />

      <div className="min-w-0 flex-1">
        <p className="truncate text-sm font-semibold text-ganker-text">
          {partida.champion_name}
          <span
            className={`ml-2 text-xs font-semibold ${
              partida.win ? "text-ganker-success" : "text-ganker-error"
            }`}
          >
            {partida.win ? "Victoria" : "Derrota"}
          </span>
        </p>
        <p className="truncate text-xs text-ganker-muted">
          {partida.queue}
          {partida.role ? ` · ${partida.role}` : ""} ·{" "}
          {formatearDuracion(partida.duration_seconds)} ·{" "}
          {formatearTiempoRelativo(partida.played_at)}
        </p>
      </div>

      <div className="shrink-0 text-right">
        <p className="text-sm font-semibold text-ganker-text">
          {partida.kills}/{partida.deaths}/{partida.assists}
        </p>
        <p className="text-xs text-ganker-muted">{partida.cs} CS</p>
      </div>
    </li>
  );
}

// Estadisticas de la cuenta de Riot vinculada (RiotStatsResponse): rangos,
// resumen de las ultimas partidas, campeones e historial.
const EstadisticasRiotComponent = ({ stats }) => {
  const { recent } = stats;

  return (
    <div className="space-y-6">
      <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
        <div className={`${CLASES_TARJETA} flex items-center gap-3`}>
          <IconoChicoComponent
            src={stats.profile_icon_url}
            alt="Ícono de invocador"
            className="h-12 w-12 shrink-0 rounded-full"
            placeholder
          />
          <div>
            <p className="text-xs text-ganker-muted">Nivel de invocador</p>
            <p className="font-heading text-lg font-semibold text-ganker-text">
              {stats.summoner_level}
            </p>
          </div>
        </div>

        {stats.ranked.length === 0 ? (
          <div className={CLASES_TARJETA}>
            <p className="text-xs text-ganker-muted">Clasificatorias</p>
            <p className="mt-1 text-sm text-ganker-text">
              Sin rango esta temporada
            </p>
          </div>
        ) : (
          stats.ranked.map((entrada) => (
            <RangoRiot key={entrada.queue} entrada={entrada} />
          ))
        )}
      </div>

      {recent.games > 0 && (
        <section>
          <h4 className={CLASES_TITULO}>Últimas {recent.games} partidas</h4>
          <div className="mt-3 grid grid-cols-2 gap-4 rounded-xl border border-white/10 bg-ganker-surface-light p-4 sm:grid-cols-4">
            <Dato
              etiqueta="Victorias"
              valor={`${recent.wins}V ${recent.losses}D (${recent.winrate}%)`}
            />
            <Dato etiqueta="KDA" valor={recent.kda.toFixed(2)} />
            <Dato
              etiqueta="K / D / A"
              valor={`${recent.avg_kills} / ${recent.avg_deaths} / ${recent.avg_assists}`}
            />
            <Dato etiqueta="Rol más jugado" valor={recent.main_role ?? "—"} />
          </div>
        </section>
      )}

      <div className="grid gap-6 lg:grid-cols-2">
        {recent.most_played.length > 0 && (
          <section>
            <h4 className={CLASES_TITULO}>Campeones más jugados</h4>
            <ul className="mt-3 space-y-2">
              {recent.most_played.map((campeon) => (
                <li
                  key={campeon.champion_name}
                  className="flex items-center gap-3 rounded-xl bg-ganker-surface-light px-3 py-2"
                >
                  <IconoChicoComponent
                    src={campeon.icon_url}
                    alt=""
                    className="h-9 w-9 shrink-0 rounded-lg"
                    placeholder
                  />
                  <span className="min-w-0 flex-1 truncate text-sm font-medium text-ganker-text">
                    {campeon.champion_name}
                  </span>
                  <span className="shrink-0 text-xs text-ganker-muted">
                    {campeon.games} partida{campeon.games === 1 ? "" : "s"} ·{" "}
                    {campeon.winrate}% · KDA {campeon.kda.toFixed(2)}
                  </span>
                </li>
              ))}
            </ul>
          </section>
        )}

        {stats.top_masteries.length > 0 && (
          <section>
            <h4 className={CLASES_TITULO}>Mayor maestría</h4>
            <ul className="mt-3 space-y-2">
              {stats.top_masteries.map((maestria) => (
                <li
                  key={maestria.champion_name}
                  className="flex items-center gap-3 rounded-xl bg-ganker-surface-light px-3 py-2"
                >
                  <IconoChicoComponent
                    src={maestria.icon_url}
                    alt=""
                    className="h-9 w-9 shrink-0 rounded-lg"
                    placeholder
                  />
                  <span className="min-w-0 flex-1 truncate text-sm font-medium text-ganker-text">
                    {maestria.champion_name}
                  </span>
                  <span className="shrink-0 text-xs text-ganker-muted">
                    Nivel {maestria.level} · {formatearPuntos(maestria.points)}{" "}
                    pts
                  </span>
                </li>
              ))}
            </ul>
          </section>
        )}
      </div>

      <section>
        <h4 className={CLASES_TITULO}>Historial de partidas</h4>
        {stats.matches.length === 0 ? (
          <p className="mt-3 text-sm text-ganker-muted">
            No hay partidas recientes.
          </p>
        ) : (
          <ul className="mt-3 space-y-2">
            {stats.matches.map((partida) => (
              <PartidaRiot key={partida.match_id} partida={partida} />
            ))}
          </ul>
        )}
      </section>
    </div>
  );
};

export default EstadisticasRiotComponent;
