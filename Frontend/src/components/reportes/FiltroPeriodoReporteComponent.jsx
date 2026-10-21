import { describirPeriodo, formatearFechaReporte } from "../../utils/reportes";

const CLASES_INPUT =
  "w-full rounded-lg border border-white/10 bg-ganker-surface-light px-3 py-2.5 text-sm text-ganker-text [color-scheme:dark] focus:border-ganker-purple focus:ring-2 focus:ring-ganker-purple focus:outline-none disabled:opacity-60";

// Periodo del reporte (US 37 y 38). Sin fechas = historico total. Si ya hay
// un reporte previo, la fecha inicial arranca como minimo el dia siguiente a
// su fin (`inicioMinimo`, sugerido por el backend). `children`: campos extra
// del reporte (ej. videojuego y tipo de analisis), arriba de las fechas.
const FiltroPeriodoReporteComponent = ({
  children,
  fechaInicio,
  fechaFin,
  inicioMinimo,
  ultimo,
  generando,
  error,
  onFechaInicioChange,
  onFechaFinChange,
  onGenerar,
}) => {
  const handleSubmit = (e) => {
    e.preventDefault();
    onGenerar();
  };

  return (
    <form
      onSubmit={handleSubmit}
      noValidate
      className="rounded-2xl border border-white/10 bg-ganker-surface p-6 shadow-xl"
    >
      <h2 className="font-heading text-xl font-semibold text-ganker-text">
        Generar reporte
      </h2>
      <p className="mt-1 text-sm text-ganker-muted">
        Dejá las fechas vacías para el histórico total, o elegí un período.
      </p>

      {children && <div className="mt-4 space-y-4">{children}</div>}

      {ultimo?.has_report && (
        <p className="mt-3 text-xs text-ganker-muted">
          Último reporte: {describirPeriodo(ultimo)}.
          {inicioMinimo &&
            ` El próximo puede arrancar desde el ${formatearFechaReporte(inicioMinimo)}.`}
        </p>
      )}

      <div className="mt-4 grid gap-4 sm:grid-cols-2">
        <div>
          <label
            htmlFor="reporte-fecha-inicio"
            className="mb-1 block text-xs font-semibold text-ganker-text"
          >
            Fecha inicial
          </label>
          <input
            id="reporte-fecha-inicio"
            type="date"
            value={fechaInicio}
            min={inicioMinimo ?? undefined}
            max={fechaFin || undefined}
            onChange={(e) => onFechaInicioChange(e.target.value)}
            disabled={generando}
            className={CLASES_INPUT}
          />
        </div>
        <div>
          <label
            htmlFor="reporte-fecha-fin"
            className="mb-1 block text-xs font-semibold text-ganker-text"
          >
            Fecha final
          </label>
          <input
            id="reporte-fecha-fin"
            type="date"
            value={fechaFin}
            min={fechaInicio || inicioMinimo || undefined}
            onChange={(e) => onFechaFinChange(e.target.value)}
            disabled={generando}
            className={CLASES_INPUT}
          />
        </div>
      </div>

      {error && (
        <div className="mt-4 rounded-lg border border-ganker-error/20 bg-ganker-error/10 px-4 py-3">
          <p className="text-sm text-ganker-error">{error}</p>
        </div>
      )}

      <button
        type="submit"
        disabled={generando}
        className="mt-5 cursor-pointer rounded-lg bg-gradient-to-r from-ganker-orange via-ganker-orange-light to-ganker-purple px-4 py-2.5 text-sm font-semibold text-white shadow-lg transition-all duration-200 hover:-translate-y-0.5 hover:shadow-ganker-purple/30 disabled:cursor-not-allowed disabled:opacity-50"
      >
        {generando ? "Generando..." : "Generar reporte"}
      </button>
    </form>
  );
};

export default FiltroPeriodoReporteComponent;
