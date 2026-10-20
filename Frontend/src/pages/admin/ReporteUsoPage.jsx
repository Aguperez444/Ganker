import FiltroPeriodoReporteComponent from "../../components/reportes/FiltroPeriodoReporteComponent";
import FranjasRangosComponent from "../../components/reportes/FranjasRangosComponent";
import HistorialReportesComponent from "../../components/reportes/HistorialReportesComponent";
import PanelUltimoReporteComponent from "../../components/reportes/PanelUltimoReporteComponent";
import ReportesTabsComponent from "../../components/reportes/ReportesTabsComponent";
import SeleccionReporteUsoComponent from "../../components/reportes/SeleccionReporteUsoComponent";
import TablaReporteUsoComponent from "../../components/reportes/TablaReporteUsoComponent";
import { useReporteUsoPorJuego } from "../../hooks/useReporteUsoPorJuego";
import { describirPeriodo } from "../../utils/reportes";

// US 38 - Generar reporte de uso por videojuego (rangos, personajes o
// equipos). Ruta dentro del area admin; el backend la protege con
// require_admin.
// Titulo del panel de tortas segun el tipo elegido.
const TITULOS_PANEL = {
  ranks: "Último reporte de distribución por rangos",
  characters: "Último reporte de personajes más utilizados",
  teams: "Último reporte de equipos por franja de rangos",
};

const ReporteUsoPage = () => {
  const r = useReporteUsoPorJuego();
  const nombreJuego =
    r.juegos.find((j) => String(j.id) === r.videogameId)?.name ??
    "Todos los videojuegos";
  const esEquipos = r.tipo === "teams";

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
            Qué rangos y personajes se usan más en cada videojuego, y en qué
            franjas de rangos hay más equipos.
          </p>
        </header>

        <ReportesTabsComponent />

        <PanelUltimoReporteComponent
          titulo={`${TITULOS_PANEL[r.tipo] ?? "Último reporte"} · ${nombreJuego}`}
          unidad={esEquipos ? "equipos" : "jugadores"}
          aclaracion={
            esEquipos
              ? null
              : "Un jugador puede contar en más de una categoría: la torta muestra cómo se reparten las elecciones."
          }
          {...r.comparacion}
        />

        {r.errorCatalogo && (
          <div className="rounded-lg border border-ganker-error/20 bg-ganker-error/10 px-4 py-3">
            <p className="text-sm text-ganker-error">{r.errorCatalogo}</p>
          </div>
        )}

        <FiltroPeriodoReporteComponent
          fechaInicio={r.fechaInicio}
          fechaFin={r.fechaFin}
          inicioMinimo={r.inicioMinimo}
          ultimo={r.ultimo}
          generando={r.generando || r.cargandoCatalogo}
          error={r.errorGenerar}
          onFechaInicioChange={r.setFechaInicio}
          onFechaFinChange={r.setFechaFin}
          onGenerar={r.generar}
        >
          <SeleccionReporteUsoComponent
            juegos={r.juegos}
            tipos={r.tipos}
            videogameId={r.videogameId}
            tipo={r.tipo}
            deshabilitado={r.generando || r.cargandoCatalogo}
            onJuegoChange={r.elegirJuego}
            onTipoChange={r.elegirTipo}
          />
          {r.usaFranjas && (
            <FranjasRangosComponent
              franjas={r.franjas}
              rangos={r.rangosDelJuego}
              error={r.errorRangos}
              deshabilitado={r.generando}
              onCambiar={r.cambiarFranja}
              onAgregar={r.agregarFranja}
              onQuitar={r.quitarFranja}
            />
          )}
        </FiltroPeriodoReporteComponent>

        {r.errorExportar && (
          <div className="rounded-lg border border-ganker-error/20 bg-ganker-error/10 px-4 py-3">
            <p className="text-sm text-ganker-error">{r.errorExportar}</p>
          </div>
        )}

        {r.reporte && (
          <TablaReporteUsoComponent
            reporte={r.reporte}
            exportando={r.exportando}
            onExportar={r.exportar}
          />
        )}

        <HistorialReportesComponent
          describir={(reporte) =>
            `Reporte #${reporte.report_id} · ${reporte.videogame_name} · ${describirPeriodo(reporte)}`
          }
          reportes={r.historial}
          cargando={r.cargandoAntecedentes}
          error={r.errorAntecedentes}
          exportando={r.exportando}
          onExportar={r.exportar}
        />
      </div>
    </section>
  );
};

export default ReporteUsoPage;
