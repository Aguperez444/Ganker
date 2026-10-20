import FiltroPeriodoReporteComponent from "../../components/reportes/FiltroPeriodoReporteComponent";
import HistorialReportesComponent from "../../components/reportes/HistorialReportesComponent";
import TablaReportePerfilesComponent from "../../components/reportes/TablaReportePerfilesComponent";
import { useReportePerfilesPorJuego } from "../../hooks/useReportePerfilesPorJuego";

// US 37 - Generar reporte de jugadores por videojuego. La ruta esta dentro
// del area admin (ProtectedRoute con ROLES_ADMIN) y el backend la protege con
// require_admin.
const ReportesPage = () => {
  const {
    fechaInicio,
    fechaFin,
    setFechaInicio,
    setFechaFin,
    inicioMinimo,
    cargandoAntecedentes,
    ultimo,
    historial,
    errorAntecedentes,
    reporte,
    generando,
    errorGenerar,
    generar,
    exportando,
    errorExportar,
    exportar,
  } = useReportePerfilesPorJuego();

  return (
    <section className="min-h-full bg-ganker-bg p-6">
      <div className="mx-auto w-full max-w-6xl space-y-6">
        <header>
          <p className="text-xs font-semibold tracking-[0.15em] text-ganker-purple-light uppercase">
            Administración
          </p>
          <h1 className="mt-2 font-heading text-3xl font-bold text-ganker-text">
            Reportes
          </h1>
          <p className="mt-2 max-w-2xl text-sm text-ganker-muted">
            Cantidad de perfiles de jugador por videojuego, para ver cuáles son
            los más populares en Ganker.
          </p>
        </header>

        <FiltroPeriodoReporteComponent
          fechaInicio={fechaInicio}
          fechaFin={fechaFin}
          inicioMinimo={inicioMinimo}
          ultimo={ultimo}
          generando={generando}
          error={errorGenerar}
          onFechaInicioChange={setFechaInicio}
          onFechaFinChange={setFechaFin}
          onGenerar={generar}
        />

        {errorExportar && (
          <div className="rounded-lg border border-ganker-error/20 bg-ganker-error/10 px-4 py-3">
            <p className="text-sm text-ganker-error">{errorExportar}</p>
          </div>
        )}

        {reporte && (
          <TablaReportePerfilesComponent
            reporte={reporte}
            exportando={exportando}
            onExportar={exportar}
          />
        )}

        <HistorialReportesComponent
          reportes={historial}
          cargando={cargandoAntecedentes}
          error={errorAntecedentes}
          exportando={exportando}
          onExportar={exportar}
        />
      </div>
    </section>
  );
};

export default ReportesPage;
