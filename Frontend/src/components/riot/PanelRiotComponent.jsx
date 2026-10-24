import { useId, useState } from "react";
import useRiotAccount from "../../hooks/useRiotAccount";
import {
  SERVIDORES_LOL,
  esRiotIdValido,
  nombreServidor,
} from "../../utils/riot";
import { formatearTiempoRelativo, parsearFechaUTC } from "../../utils/tiempo";
import EstadisticasRiotComponent from "./EstadisticasRiotComponent";

const CLASES_BOTON_SECUNDARIO =
  "cursor-pointer rounded-lg border border-white/10 bg-ganker-surface-light px-3 py-2 text-sm font-semibold text-ganker-text transition hover:border-ganker-purple/40 hover:bg-ganker-purple/20 disabled:cursor-not-allowed disabled:opacity-50";

// `pideServidor`: en LoL el jugador elige el servidor; en Valorant la region
// la informa Riot. `conEstadisticas`: si Riot deja leer partidas de ese juego.
function FormularioVincular({
  onVincular,
  enCurso,
  pideServidor,
  conEstadisticas,
}) {
  const [riotId, setRiotId] = useState("");
  const [servidor, setServidor] = useState("la2");
  const riotIdValido = esRiotIdValido(riotId);
  // En Mi perfil puede haber un panel de LoL y otro de Valorant a la vez
  const idRiotId = useId();
  const idServidor = useId();

  const handleSubmit = (e) => {
    e.preventDefault();
    if (!riotIdValido) return;
    onVincular({
      riotId: riotId.trim(),
      server: pideServidor ? servidor : undefined,
    });
  };

  return (
    <form onSubmit={handleSubmit} className="space-y-3">
      <p className="text-sm text-ganker-muted">
        {conEstadisticas
          ? "Vinculá tu cuenta de Riot para mostrar tu historial de partidas, campeones más jugados, KDA y rango. El rango de este perfil pasa a ser el de tu cuenta."
          : "Vinculá tu cuenta de Riot para que los demás jugadores vean tu Riot ID verificado y la región donde jugás."}
      </p>

      <div
        className={`grid gap-3 ${
          pideServidor
            ? "sm:grid-cols-[minmax(0,1fr)_minmax(0,14rem)_auto]"
            : "sm:grid-cols-[minmax(0,1fr)_auto]"
        }`}
      >
        <div>
          <label
            htmlFor={idRiotId}
            className="mb-1 block text-xs font-semibold text-ganker-text"
          >
            Riot ID
          </label>
          <input
            id={idRiotId}
            value={riotId}
            onChange={(e) => setRiotId(e.target.value)}
            placeholder="Nombre#TAG"
            autoComplete="off"
            className="w-full rounded-lg border border-white/10 bg-ganker-surface-light px-3 py-2.5 text-sm text-ganker-text placeholder:text-ganker-muted focus:border-ganker-purple focus:ring-2 focus:ring-ganker-purple focus:outline-none"
          />
        </div>

        {pideServidor && (
          <div>
            <label
              htmlFor={idServidor}
              className="mb-1 block text-xs font-semibold text-ganker-text"
            >
              Servidor
            </label>
            <select
              id={idServidor}
              value={servidor}
              onChange={(e) => setServidor(e.target.value)}
              className="w-full rounded-lg border border-white/10 bg-ganker-surface-light px-3 py-2.5 text-sm text-ganker-text focus:border-ganker-purple focus:ring-2 focus:ring-ganker-purple focus:outline-none"
            >
              {SERVIDORES_LOL.map((s) => (
                <option key={s.value} value={s.value}>
                  {s.label}
                </option>
              ))}
            </select>
          </div>
        )}

        <button
          type="submit"
          disabled={!riotIdValido || enCurso}
          className="cursor-pointer self-end rounded-lg bg-gradient-to-r from-ganker-orange to-ganker-purple px-5 py-2.5 text-sm font-semibold text-white transition hover:opacity-90 disabled:cursor-not-allowed disabled:opacity-50"
        >
          {enCurso ? "Vinculando..." : "Vincular cuenta"}
        </button>
      </div>

      {riotId.trim() && !riotIdValido && (
        <p className="text-xs text-ganker-muted">
          El Riot ID tiene la forma Nombre#TAG (lo ves en tu perfil del cliente
          de Riot).
        </p>
      )}
    </form>
  );
}

// Cuenta de Riot de un perfil de juego. No muestra nada en juegos que no son
// de Riot. `esPropio` habilita vincular, actualizar y desvincular; los demas
// jugadores solo ven la cuenta (y sus estadisticas, si el juego las tiene).
//
// Valorant: Riot no deja leer sus partidas con la clave de Ganker (solo a
// aplicaciones de produccion), asi que se vincula el Riot ID sin estadisticas
// (`provides_stats` = false).
const PanelRiotComponent = ({
  gameProfileId,
  esPropio,
  onRangoActualizado,
}) => {
  const {
    cuenta,
    cargando,
    error,
    accionEnCurso,
    errorAccion,
    mensaje,
    vincular,
    actualizar,
    desvincular,
  } = useRiotAccount(gameProfileId, { onRangoActualizado });

  if (cargando || !cuenta?.supported) {
    return null;
  }
  if (!cuenta.linked && !esPropio) {
    return null;
  }

  const puedeActualizar =
    !cuenta.next_refresh_at ||
    parsearFechaUTC(cuenta.next_refresh_at) <= new Date();

  return (
    <section className="rounded-2xl border border-white/10 bg-ganker-surface p-5 sm:p-6">
      <div className="mb-4 flex flex-col gap-3 sm:flex-row sm:items-start sm:justify-between">
        <div>
          <h3 className="font-heading text-lg font-semibold text-ganker-text">
            Cuenta de Riot
          </h3>
          {cuenta.linked && (
            <p className="mt-1 text-sm text-ganker-muted">
              <span className="font-semibold text-ganker-text">
                {cuenta.riot_id}
              </span>{" "}
              · {nombreServidor(cuenta.server)}
              {cuenta.last_synced_at &&
                ` · actualizado ${formatearTiempoRelativo(cuenta.last_synced_at)}`}
            </p>
          )}
        </div>

        {esPropio && cuenta.linked && (
          <div className="flex shrink-0 gap-2">
            {cuenta.provides_stats && (
              <button
                type="button"
                onClick={actualizar}
                disabled={Boolean(accionEnCurso) || !puedeActualizar}
                title={
                  puedeActualizar
                    ? "Traer los datos más recientes de Riot"
                    : "Esperá unos minutos para volver a actualizar"
                }
                className={CLASES_BOTON_SECUNDARIO}
              >
                {accionEnCurso === "actualizar"
                  ? "Actualizando..."
                  : "Actualizar"}
              </button>
            )}
            <button
              type="button"
              onClick={desvincular}
              disabled={Boolean(accionEnCurso)}
              className="cursor-pointer rounded-lg border border-ganker-error/40 px-3 py-2 text-sm font-semibold text-ganker-error transition hover:bg-ganker-error/10 disabled:cursor-not-allowed disabled:opacity-50"
            >
              {accionEnCurso === "desvincular"
                ? "Desvinculando..."
                : "Desvincular"}
            </button>
          </div>
        )}
      </div>

      {(error || errorAccion) && (
        <div className="mb-4 rounded-lg border border-ganker-error/20 bg-ganker-error/10 px-4 py-3">
          <p className="text-sm text-ganker-error">{error || errorAccion}</p>
        </div>
      )}

      {mensaje && (
        <div className="mb-4 rounded-lg border border-ganker-success/20 bg-ganker-success/10 px-4 py-3">
          <p className="text-sm text-ganker-success">✓ {mensaje}</p>
        </div>
      )}

      {cuenta.linked ? (
        cuenta.stats ? (
          <EstadisticasRiotComponent stats={cuenta.stats} />
        ) : (
          !cuenta.provides_stats && (
            <p className="text-sm text-ganker-muted">
              ✓ Cuenta verificada con Riot. Riot no permite consultar el
              historial ni el rango de este juego desde aplicaciones como
              Ganker, así que no hay estadísticas para mostrar.
            </p>
          )
        )
      ) : (
        <FormularioVincular
          onVincular={vincular}
          enCurso={accionEnCurso === "vincular"}
          pideServidor={cuenta.requires_server}
          conEstadisticas={cuenta.provides_stats}
        />
      )}
    </section>
  );
};

export default PanelRiotComponent;
