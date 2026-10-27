import { Link } from "react-router-dom";
import { armarComparacion } from "../../utils/graficosReporte";
import { describirPeriodo } from "../../utils/reportes";

// Dona chica con conic-gradient (la de GraficoTortaComponent mide 168px y
// tiene el detalle interactivo; aca alcanza con la forma y el total).
function MiniTorta({ segmentos, titulo, unidad }) {
  // Cada porcion arranca donde terminan las anteriores (como en la torta grande).
  const porciones = segmentos.map((s, indice) => {
    const desde = segmentos
      .slice(0, indice)
      .reduce((acc, previo) => acc + previo.proporcion * 100, 0);
    return `${s.color} ${desde}% ${desde + s.proporcion * 100}%`;
  });
  const total = segmentos.reduce((acc, s) => acc + s.valor, 0);
  const descripcion = segmentos
    .map((s) => `${s.nombre}: ${Math.round(s.proporcion * 100)}%`)
    .join(", ");

  return (
    <div
      role="img"
      aria-label={`${titulo}. ${descripcion}`}
      className="relative h-16 w-16 shrink-0 rounded-full"
      style={{ background: `conic-gradient(${porciones.join(", ")})` }}
    >
      <div className="absolute inset-[9px] flex flex-col items-center justify-center rounded-full bg-ganker-surface">
        <span className="font-heading text-sm leading-none font-bold text-ganker-text">
          {total}
        </span>
        <span className="text-[9px] leading-tight text-ganker-muted">
          {unidad}
        </span>
      </div>
    </div>
  );
}

// Resumen compacto de los ultimos reportes para el inicio del panel admin:
// una fila por reporte con su dona y sus tres categorias principales.
// `reportes`: lo que devuelve useResumenReportes.
function ResumenReportesComponent({ reportes, cargando, error }) {
  return (
    <section className="rounded-2xl border border-white/10 bg-ganker-surface p-5">
      <div className="flex items-center justify-between">
        <h2 className="font-heading text-lg font-semibold text-ganker-text">
          Últimos reportes
        </h2>
        <Link
          to="/app/admin/reportes"
          className="text-sm font-semibold text-ganker-purple-light hover:underline"
        >
          Ir a reportes →
        </Link>
      </div>

      {cargando ? (
        <p className="mt-4 text-sm text-ganker-muted">Cargando reportes...</p>
      ) : error ? (
        <p className="mt-4 text-sm text-ganker-error">{error}</p>
      ) : reportes.length === 0 ? (
        <p className="mt-4 text-sm text-ganker-muted">
          Todavía no se generó ningún reporte. Generá uno desde Reportes para
          verlo resumido acá.
        </p>
      ) : (
        <ul className="mt-3 divide-y divide-white/5">
          {reportes.map((reporte) => {
            const segmentos = armarComparacion(reporte.datos.items).ultimo;
            return (
              <li key={reporte.clave} className="flex items-center gap-4 py-3">
                <MiniTorta
                  segmentos={segmentos}
                  titulo={reporte.titulo}
                  unidad={reporte.unidad}
                />
                <div className="min-w-0 flex-1">
                  <p className="truncate text-sm font-semibold text-ganker-text">
                    {reporte.titulo}
                  </p>
                  <p className="truncate text-[11px] text-ganker-muted">
                    {describirPeriodo(reporte.resumen)}
                  </p>
                  <ul className="mt-1.5 flex flex-wrap gap-x-3 gap-y-0.5">
                    {segmentos.slice(0, 3).map((s) => (
                      <li
                        key={s.clave}
                        className="flex min-w-0 items-center gap-1.5 text-xs"
                      >
                        <span
                          aria-hidden="true"
                          className="h-2 w-2 shrink-0 rounded-full ring-1 ring-white/40"
                          style={{ backgroundColor: s.color }}
                        />
                        <span className="max-w-[9rem] truncate text-ganker-text">
                          {s.nombre}
                        </span>
                        <span className="text-ganker-muted">
                          {Math.round(s.proporcion * 100)}%
                        </span>
                      </li>
                    ))}
                  </ul>
                </div>
              </li>
            );
          })}
        </ul>
      )}
    </section>
  );
}

export default ResumenReportesComponent;
