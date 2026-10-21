import BotonesExportarReporteComponent from "./BotonesExportarReporteComponent";
import { describirPeriodo, formatearGeneradoEl } from "../../utils/reportes";

// Reportes generados antes (vienen del mas reciente al mas antiguo). El
// backend no devuelve sus datos de nuevo, pero se pueden exportar.
// `describir` (opcional): titulo de cada fila; por defecto, id y periodo.
const describirPorDefecto = (reporte) =>
  `Reporte #${reporte.report_id} · ${describirPeriodo(reporte)}`;

const HistorialReportesComponent = ({
  describir = describirPorDefecto,
  reportes,
  cargando,
  error,
  exportando,
  onExportar,
}) => {
  let contenido;

  if (cargando) {
    contenido = (
      <p className="text-sm text-ganker-muted">Cargando reportes previos...</p>
    );
  } else if (error) {
    contenido = <p className="text-sm text-ganker-error">{error}</p>;
  } else if (reportes.length === 0) {
    contenido = (
      <p className="text-sm text-ganker-muted">
        Todavía no se generó ningún reporte.
      </p>
    );
  } else {
    contenido = (
      <ul className="divide-y divide-white/10 overflow-hidden rounded-xl border border-white/10">
        {reportes.map((reporte) => (
          <li
            key={reporte.report_id}
            className="flex flex-col gap-3 bg-ganker-surface-light px-5 py-4 sm:flex-row sm:items-center sm:justify-between"
          >
            <div className="min-w-0">
              <p className="font-medium text-ganker-text">
                {describir(reporte)}
              </p>
              <p className="text-xs text-ganker-muted">
                Generado el {formatearGeneradoEl(reporte.generated_at)}
              </p>
            </div>
            <BotonesExportarReporteComponent
              reportId={reporte.report_id}
              exportando={exportando}
              onExportar={onExportar}
            />
          </li>
        ))}
      </ul>
    );
  }

  return (
    <section className="rounded-2xl border border-white/10 bg-ganker-surface p-6 shadow-xl">
      <h2 className="mb-4 font-heading text-xl font-semibold text-ganker-text">
        Reportes anteriores
      </h2>
      {contenido}
    </section>
  );
};

export default HistorialReportesComponent;
