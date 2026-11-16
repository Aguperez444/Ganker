import { useEffect, useState } from "react";
import { Link } from "react-router-dom";
import { obtenerReporteDenuncias } from "../../api/reportesApi";

export default function TarjetaReporteModeracionComponent({
  actualizacion = 0,
}) {
  const [consulta, setConsulta] = useState({});
  const [reintento, setReintento] = useState(0);
  const clave = `${actualizacion}:${reintento}`;
  const cargando = consulta.clave !== clave;

  useEffect(() => {
    let activo = true;
    obtenerReporteDenuncias({ ranking_limit: 1 }).then(
      (reporte) => {
        if (activo) setConsulta({ reporte, clave });
      },
      () => {
        if (activo)
          setConsulta({
            error: "No se pudo cargar el resumen de moderación.",
            clave,
          });
      }
    );
    return () => {
      activo = false;
    };
  }, [clave]);

  const reporte = !cargando && consulta.reporte;
  return (
    <section
      aria-labelledby="resumen-moderacion"
      className="rounded-2xl border border-ganker-purple-light/25 bg-ganker-surface p-6"
    >
      <div className="flex flex-wrap items-start justify-between gap-4">
        <div>
          <h2
            id="resumen-moderacion"
            className="font-heading text-lg font-semibold text-ganker-text"
          >
            Resumen de moderación
          </h2>
          <p className="mt-1 text-sm text-ganker-muted">
            Totales históricos y pendientes actuales de la comunidad.
          </p>
        </div>
        <Link
          to="/app/admin/moderacion/reporte"
          className="rounded-lg bg-ganker-purple px-4 py-2.5 text-sm font-semibold text-white transition hover:bg-ganker-purple/80"
        >
          Ver reporte completo →
        </Link>
      </div>
      {cargando ? (
        <p role="status" className="mt-5 text-sm text-ganker-muted">
          Cargando resumen...
        </p>
      ) : consulta.error ? (
        <div className="mt-5 text-sm text-ganker-muted" role="alert">
          {consulta.error}{" "}
          <button
            type="button"
            onClick={() => setReintento((valor) => valor + 1)}
            className="cursor-pointer text-ganker-purple-light hover:underline"
          >
            Reintentar resumen
          </button>
        </div>
      ) : (
        <dl className="mt-5 grid grid-cols-2 gap-4 sm:grid-cols-4">
          {[
            ["Denuncias recibidas", reporte.reports.total],
            ["Denuncias pendientes", reporte.reports.pending],
            ["Baneos vigentes", reporte.bans.active],
            ["Apelaciones pendientes", reporte.appeals.pending],
          ].map(([titulo, valor]) => (
            <div key={titulo} className="rounded-xl bg-white/5 p-3">
              <dt className="text-xs text-ganker-muted">{titulo}</dt>
              <dd className="mt-2 font-heading text-2xl font-bold text-ganker-text">
                {valor.toLocaleString("es-AR")}
              </dd>
            </div>
          ))}
        </dl>
      )}
    </section>
  );
}
