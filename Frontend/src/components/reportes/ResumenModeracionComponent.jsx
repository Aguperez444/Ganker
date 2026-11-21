import GraficoTortaComponent from "./GraficoTortaComponent";
import { Link } from "react-router-dom";
import { COLORES_CATEGORIAS, COLOR_OTROS } from "../../utils/graficosReporte";
import { nombreDeMotivoReporte } from "../../utils/reportesJugadores";

// Misma paleta de marca que los demas reportes (graficosReporte.js). Aca no
// se agrupa en "Otros" (hay hasta 6 categorias fijas), asi que se suman la
// crema y el gris de ganker-muted como quinto y sexto color.
const COLORES = [...COLORES_CATEGORIAS, COLOR_OTROS, "#9D97B5"];
const RESULTADOS = {
  active: "Vigentes",
  expired: "Finalizados por tiempo",
  manual: "Desbaneos manuales",
  appeal: "Apelaciones aceptadas",
  superseded: "Sustituidos por otro baneo",
  unknown: "Finalizados sin detalle histórico",
};
const numero = (valor) => valor.toLocaleString("es-AR");

function Indicador({ titulo, valor, detalle }) {
  return (
    <div className="rounded-xl border border-white/10 bg-ganker-surface p-5">
      <dt className="text-sm text-ganker-muted">{titulo}</dt>
      <dd className="mt-2 font-heading text-3xl font-bold text-ganker-text">
        {numero(valor)}
      </dd>
      {detalle && <dd className="mt-1 text-xs text-ganker-muted">{detalle}</dd>}
    </div>
  );
}

function Distribucion({ titulo, items, unidad }) {
  const total = items.reduce((suma, item) => suma + item.count, 0);
  const segmentos = items
    .filter((item) => item.count > 0)
    .map((item, indice) => ({
      clave: item.key,
      nombre: item.name,
      valor: item.count,
      proporcion: item.count / total,
      color: COLORES[indice % COLORES.length],
    }));
  return (
    <section
      className="rounded-xl border border-white/10 bg-ganker-surface p-5"
      aria-label={titulo}
    >
      {total ? (
        <>
          <GraficoTortaComponent
            titulo={titulo}
            segmentos={segmentos}
            unidad={unidad}
          />
          <ul className="mt-4 space-y-3">
            {segmentos.map((item) => (
              <li key={item.clave} className="flex items-center gap-2 text-sm">
                <span
                  className="h-2.5 w-2.5 shrink-0 rounded-sm"
                  style={{ backgroundColor: item.color }}
                  aria-hidden="true"
                />
                <span className="flex-1 text-ganker-muted">{item.nombre}</span>
                <span className="text-ganker-text">
                  {numero(item.valor)}{" "}
                  <span className="text-xs text-ganker-muted">
                    ({(item.proporcion * 100).toFixed(1)}%)
                  </span>
                </span>
              </li>
            ))}
          </ul>
        </>
      ) : (
        <>
          <h3 className="font-semibold text-ganker-text">{titulo}</h3>
          <p className="mt-4 text-sm text-ganker-muted">
            Sin datos en este período.
          </p>
        </>
      )}
    </section>
  );
}

function RankingJugadores({
  titulo,
  items,
  denuncias = false,
  limite,
  onVerHistorial,
}) {
  return (
    <section className="overflow-hidden rounded-xl border border-white/10 bg-ganker-surface">
      <div className="p-5">
        <h3 className="font-semibold text-ganker-text">{titulo}</h3>
        <p className="mt-1 text-xs text-ganker-muted">
          Hasta {limite} jugadores, ordenados de mayor a menor cantidad.
        </p>
      </div>
      {!items.length ? (
        <p className="px-5 pb-5 text-sm text-ganker-muted">
          Sin jugadores en este período.
        </p>
      ) : (
        <div className="overflow-x-auto">
          <table className="w-full text-left text-sm">
            <caption className="sr-only">{titulo}</caption>
            <thead className="bg-white/5 text-xs text-ganker-muted">
              <tr>
                <th className="px-5 py-3" scope="col">
                  Puesto
                </th>
                <th className="px-5 py-3" scope="col">
                  Jugador
                </th>
                <th className="px-5 py-3 text-right" scope="col">
                  {denuncias ? "Denuncias" : "Baneos"}
                </th>
                <th className="px-5 py-3 text-right" scope="col">
                  {denuncias ? "Denunciantes distintos" : "Baneos anteriores"}
                </th>
                <th className="px-5 py-3 text-right" scope="col">
                  Historial
                </th>
              </tr>
            </thead>
            <tbody className="divide-y divide-white/5 text-ganker-text">
              {items.map((item, indice) => (
                <tr key={item.user_id}>
                  <td className="px-5 py-3 text-ganker-muted">{indice + 1}</td>
                  <th scope="row" className="px-5 py-3 font-medium break-words">
                    {item.deleted ? "Cuenta eliminada" : `@${item.username}`}
                  </th>
                  <td className="px-5 py-3 text-right font-semibold">
                    {numero(item.count)}
                  </td>
                  <td className="px-5 py-3 text-right text-ganker-muted">
                    {denuncias
                      ? numero(item.reporters)
                      : item.repeat_offender
                        ? "Sí"
                        : "No"}
                  </td>
                  <td className="px-5 py-3 text-right">
                    <button
                      type="button"
                      disabled={item.deleted}
                      onClick={() => onVerHistorial(item)}
                      aria-label={`${denuncias ? "Ver denuncias" : "Ver baneos"} de ${item.deleted ? "cuenta eliminada" : `@${item.username}`}`}
                      title={
                        item.deleted
                          ? "El historial de cuentas eliminadas no está disponible para revisión."
                          : "Abrir historial completo del jugador"
                      }
                      className="cursor-pointer whitespace-nowrap rounded-lg border border-ganker-purple-light/30 px-3 py-2 text-xs font-semibold text-ganker-purple-light hover:bg-ganker-purple/10 disabled:cursor-not-allowed disabled:opacity-40"
                    >
                      {denuncias ? "Ver denuncias" : "Ver baneos"}
                    </button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
    </section>
  );
}

export default function ResumenModeracionComponent({
  reporte,
  onVerDenuncias,
  onVerBaneos,
}) {
  const {
    reports: denuncias,
    bans: baneos,
    appeals: apelaciones,
    activity: actividad,
    ranking_limit: limite,
  } = reporte;
  const maximoJuegos = Math.max(
    1,
    ...denuncias.games.map((juego) => juego.count)
  );
  const maximoActividad = Math.max(
    1,
    ...actividad.flatMap((mes) => [mes.reports, mes.bans])
  );
  return (
    <div className="space-y-10">
      <section aria-labelledby="apartado-denuncias" className="space-y-5">
        <div>
          <h2
            id="apartado-denuncias"
            className="font-heading text-2xl font-semibold text-ganker-text"
          >
            Denuncias
          </h2>
          <p className="mt-1 text-sm text-ganker-muted">
            Volumen, motivos y jugadores involucrados. Una denuncia no implica
            culpabilidad.
          </p>
        </div>
        <dl className="grid gap-3 sm:grid-cols-2 xl:grid-cols-4">
          <Indicador
            titulo="Denuncias recibidas"
            valor={denuncias.total}
            detalle={`${numero(denuncias.reporters)} denunciantes distintos`}
          />
          <Indicador
            titulo="Pendientes de revisión"
            valor={denuncias.pending}
          />
          <Indicador
            titulo="Jugadores denunciados"
            valor={denuncias.reported_players}
          />
          <Indicador
            titulo="Con evidencia adjunta"
            valor={denuncias.with_evidence}
            detalle={`${denuncias.total ? ((denuncias.with_evidence / denuncias.total) * 100).toFixed(1) : "0"}% del total; imagen o video`}
          />
        </dl>
        <div className="grid gap-5 lg:grid-cols-2">
          <Distribucion
            titulo="Motivos de denuncia"
            items={denuncias.reasons.map((item) => ({
              ...item,
              name: nombreDeMotivoReporte(item.key),
            }))}
            unidad="denuncias"
          />
          <Distribucion
            titulo="Estado de las denuncias"
            items={[
              { key: "pending", name: "Pendientes", count: denuncias.pending },
              { key: "resolved", name: "Resueltas", count: denuncias.resolved },
              {
                key: "dismissed",
                name: "Desestimadas",
                count: denuncias.dismissed,
              },
            ]}
            unidad="denuncias"
          />
        </div>
        <section
          aria-labelledby="juegos-denunciados"
          className="rounded-xl border border-white/10 bg-ganker-surface p-5"
        >
          <h3
            id="juegos-denunciados"
            className="font-semibold text-ganker-text"
          >
            Juegos con más denuncias
          </h3>
          <p className="mt-1 text-xs text-ganker-muted">
            Se usa el juego indicado al denunciar.{" "}
            {numero(denuncias.without_game)} denuncias sin juego especificado,
            incluidas las anteriores a este registro.
          </p>
          {!denuncias.games.length ? (
            <p className="mt-4 text-sm text-ganker-muted">
              Sin datos en este período.
            </p>
          ) : (
            <ol className="mt-5 max-h-96 space-y-4 overflow-y-auto pr-2">
              {denuncias.games.map((juego) => (
                <li key={juego.videogame_id ?? "sin-juego"}>
                  <div className="mb-1 flex justify-between gap-3 text-sm">
                    <span className="text-ganker-text">{juego.name}</span>
                    <span className="shrink-0 text-ganker-muted">
                      {numero(juego.count)} (
                      {((juego.count / denuncias.total) * 100).toFixed(1)}%)
                    </span>
                  </div>
                  <div
                    className="h-2 rounded-full bg-white/5"
                    aria-hidden="true"
                  >
                    <div
                      className={`h-full rounded-full ${juego.videogame_id == null ? "bg-ganker-muted" : "bg-ganker-purple-light"}`}
                      style={{
                        width: `${(juego.count / maximoJuegos) * 100}%`,
                      }}
                    />
                  </div>
                </li>
              ))}
            </ol>
          )}
        </section>
        <RankingJugadores
          titulo="Jugadores con más denuncias"
          items={denuncias.top_players}
          denuncias
          limite={limite}
          onVerHistorial={onVerDenuncias}
        />
      </section>

      <section
        aria-labelledby="apartado-baneos"
        className="space-y-5 border-t border-white/10 pt-8"
      >
        <div>
          <h2
            id="apartado-baneos"
            className="font-heading text-2xl font-semibold text-ganker-text"
          >
            Baneos
          </h2>
          <p className="mt-1 text-sm text-ganker-muted">
            Sanciones creadas en el período y su estado actual.
          </p>
        </div>
        <dl className="grid gap-3 sm:grid-cols-2 xl:grid-cols-4">
          <Indicador
            titulo="Baneos aplicados"
            valor={baneos.total}
            detalle={`${numero(baneos.banned_players)} jugadores distintos`}
          />
          <Indicador titulo="Todavía vigentes" valor={baneos.active} />
          <Indicador titulo="Finalizados" valor={baneos.finalized} />
          <Indicador
            titulo="Jugadores reincidentes"
            valor={baneos.repeat_offenders}
            detalle="Con algún baneo previo, incluso anterior al período."
          />
        </dl>
        <div>
          <Distribucion
            titulo="Situación de los baneos"
            items={baneos.outcomes.map((item) => ({
              ...item,
              name: RESULTADOS[item.key] || item.key,
            }))}
            unidad="baneos"
          />
        </div>
        <RankingJugadores
          titulo="Jugadores con más baneos"
          items={baneos.top_players}
          limite={limite}
          onVerHistorial={onVerBaneos}
        />
      </section>

      <section
        aria-labelledby="apartado-apelaciones"
        className="space-y-5 border-t border-white/10 pt-8"
      >
        <div className="flex flex-wrap items-start justify-between gap-4">
          <div>
            <h2
              id="apartado-apelaciones"
              className="font-heading text-2xl font-semibold text-ganker-text"
            >
              Apelaciones
            </h2>
            <p className="mt-1 text-sm text-ganker-muted">
              Presentadas en el período, aunque el baneo sea anterior. Los
              estados reflejan su situación actual.
            </p>
          </div>
          <Link
            to="/app/admin/moderacion?vista=apelaciones#sanciones"
            className="rounded-lg border border-ganker-purple-light/30 px-4 py-2 text-sm font-semibold text-ganker-purple-light hover:bg-ganker-purple/10"
          >
            Ver apelaciones →
          </Link>
        </div>
        <dl className="grid gap-3 sm:grid-cols-2 xl:grid-cols-4">
          <Indicador
            titulo="Apelaciones presentadas"
            valor={apelaciones.total}
          />
          <Indicador
            titulo="Apelaciones pendientes"
            valor={apelaciones.pending}
          />
          <Indicador
            titulo="Aceptadas y desbaneadas"
            valor={apelaciones.accepted}
          />
          <Indicador
            titulo="Apelaciones rechazadas"
            valor={apelaciones.rejected}
          />
        </dl>
        <div className="grid items-start gap-5 lg:grid-cols-2">
          <Distribucion
            titulo="Estado de las apelaciones"
            items={[
              {
                key: "pending",
                name: "Pendientes",
                count: apelaciones.pending,
              },
              {
                key: "accepted",
                name: "Aceptadas",
                count: apelaciones.accepted,
              },
              {
                key: "rejected",
                name: "Rechazadas",
                count: apelaciones.rejected,
              },
            ]}
            unidad="apelaciones"
          />
          <section
            aria-labelledby="revision-apelaciones"
            className="rounded-xl border border-white/10 bg-ganker-surface p-5"
          >
            <h3
              id="revision-apelaciones"
              className="font-semibold text-ganker-text"
            >
              Resultado de las revisiones
            </h3>
            <p className="mt-2 text-sm text-ganker-muted">
              {numero(apelaciones.accepted + apelaciones.rejected)} de{" "}
              {numero(apelaciones.total)} apelaciones del período ya fueron
              revisadas.
            </p>
            <p className="mt-4 font-heading text-3xl font-bold text-ganker-text">
              {apelaciones.accepted + apelaciones.rejected
                ? `${((apelaciones.accepted / (apelaciones.accepted + apelaciones.rejected)) * 100).toFixed(1)}%`
                : "—"}
            </p>
            <p className="mt-1 text-xs text-ganker-muted">
              Aceptadas sobre el total de apelaciones revisadas. Las pendientes
              quedan fuera de este porcentaje.
            </p>
          </section>
        </div>
      </section>

      <section
        aria-labelledby="evolucion-moderacion"
        className="rounded-xl border border-white/10 bg-ganker-surface p-5"
      >
        <h2
          id="evolucion-moderacion"
          className="font-heading text-xl font-semibold text-ganker-text"
        >
          Evolución mensual
        </h2>
        <p className="mt-1 text-xs text-ganker-muted">
          Denuncias recibidas y baneos aplicados por mes (UTC). Se muestran los
          meses con actividad.
        </p>
        <div className="mt-3 flex gap-4 text-xs text-ganker-muted">
          <span>
            <span className="text-ganker-purple-light">■</span> Denuncias
          </span>
          <span>
            <span className="text-ganker-orange">■</span> Baneos
          </span>
        </div>
        {!actividad.length ? (
          <p className="mt-4 text-sm text-ganker-muted">
            Sin actividad en este período.
          </p>
        ) : (
          <ul className="mt-5 max-h-96 space-y-4 overflow-y-auto pr-2">
            {actividad.map((mes) => (
              <li
                key={mes.month}
                className="grid gap-2 sm:grid-cols-[6rem_1fr]"
              >
                <span className="text-sm text-ganker-muted">{mes.month}</span>
                <div className="space-y-2">
                  {[
                    ["Denuncias", mes.reports, "bg-ganker-purple-light"],
                    ["Baneos", mes.bans, "bg-ganker-orange"],
                  ].map(([nombre, cantidad, color]) => (
                    <div key={nombre} className="flex items-center gap-3">
                      <div
                        className="h-2 flex-1 rounded-full bg-white/5"
                        aria-hidden="true"
                      >
                        <div
                          className={`h-full rounded-full ${color}`}
                          style={{
                            width: `${(cantidad / maximoActividad) * 100}%`,
                          }}
                        />
                      </div>
                      <span className="w-12 text-right text-xs text-ganker-text">
                        <span className="sr-only">{nombre}: </span>
                        {numero(cantidad)}
                      </span>
                    </div>
                  ))}
                </div>
              </li>
            ))}
          </ul>
        )}
      </section>
      <p className="text-xs text-ganker-muted">
        Los totales conservan los registros de cuentas eliminadas; sus nombres
        se ocultan en los rankings.
      </p>
    </div>
  );
}
