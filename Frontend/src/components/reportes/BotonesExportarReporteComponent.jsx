import { FORMATOS_EXPORTACION } from "../../utils/reportes";

// Un boton por formato de exportacion (CSV, Excel, PDF) de un reporte ya
// generado. `exportando` es "<reportId>-<formato>" del que se esta bajando.
const BotonesExportarReporteComponent = ({
  reportId,
  exportando,
  onExportar,
}) => (
  <div className="flex flex-wrap gap-2">
    {FORMATOS_EXPORTACION.map(({ valor, etiqueta }) => {
      const enCurso = exportando === `${reportId}-${valor}`;
      return (
        <button
          key={valor}
          type="button"
          onClick={() => onExportar(reportId, valor)}
          disabled={Boolean(exportando)}
          aria-label={`Exportar reporte ${reportId} en ${etiqueta}`}
          className="cursor-pointer rounded-lg border border-ganker-purple-light/40 px-3 py-1.5 text-xs font-semibold text-ganker-purple-light transition hover:bg-ganker-purple/20 hover:text-ganker-text disabled:cursor-not-allowed disabled:opacity-50"
        >
          {enCurso ? "Exportando..." : etiqueta}
        </button>
      );
    })}
  </div>
);

export default BotonesExportarReporteComponent;
