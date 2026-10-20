import GraficoTortaComponent from "./GraficoTortaComponent";
import TendenciaReporteComponent from "./TendenciaReporteComponent";
import { armarComparacion } from "../../utils/graficosReporte";
import {
  describirPeriodo,
  formatearGeneradoEl,
  formatearVariacion,
} from "../../utils/reportes";

// Panel fijo arriba de cada pestaña de Admin > Reportes: tortas del ultimo
// reporte generado y del anterior (mismos colores por categoria) y, en la
// leyenda, cuanto cambio cada una. `ultimo` / `anterior`: { items, total };
// los resumenes traen id y periodo.
const PanelUltimoReporteComponent = ({
  titulo,
  unidad,
  hayReporte,
  cargando,
  error,
  ultimoResumen,
  anteriorResumen,
  ultimo,
  anterior,
  aclaracion,
}) => {
  let contenido;

  if (!hayReporte) {
    contenido = (
      <p className="text-sm text-ganker-muted">
        Todavía no se generó ningún reporte de este tipo.
      </p>
    );
  } else if (cargando) {
    contenido = (
      <p className="text-sm text-ganker-muted">Cargando último reporte...</p>
    );
  } else if (error) {
    contenido = <p className="text-sm text-ganker-error">{error}</p>;
  } else if (ultimo) {
    const comparacion = armarComparacion(ultimo.items, anterior?.items);
    const totalUltimo = comparacion.ultimo.reduce((a, s) => a + s.valor, 0);
    const totalAnterior = comparacion.anterior?.reduce(
      (a, s) => a + s.valor,
      0
    );
    const diferencia =
      totalAnterior === undefined ? null : totalUltimo - totalAnterior;
    const conVariacion = comparacion.leyenda.some((f) => f.variation !== null);

    contenido = (
      <div className="grid gap-6 lg:grid-cols-[auto_minmax(0,1fr)] lg:items-center">
        <div className="flex flex-wrap justify-center gap-6">
          <GraficoTortaComponent
            titulo={`Último · Reporte #${ultimoResumen.report_id}`}
            subtitulo={describirPeriodo(ultimoResumen)}
            segmentos={comparacion.ultimo}
            unidad={unidad}
          />
          {comparacion.anterior && (
            <GraficoTortaComponent
              titulo={`Anterior · Reporte #${anteriorResumen.report_id}`}
              subtitulo={describirPeriodo(anteriorResumen)}
              segmentos={comparacion.anterior}
              unidad={unidad}
            />
          )}
        </div>

        <div className="min-w-0">
          {diferencia !== null && (
            <p className="mb-3 text-sm text-ganker-muted">
              <span className="font-heading text-lg font-semibold text-ganker-text">
                {formatearVariacion(diferencia, null)} {unidad}
              </span>{" "}
              respecto al reporte anterior ({totalAnterior} → {totalUltimo}).
            </p>
          )}

          <table className="w-full text-left text-sm">
            <caption className="sr-only">
              Detalle del último reporte por categoría
            </caption>
            <thead className="text-xs text-ganker-muted">
              <tr>
                <th scope="col" className="py-1 pr-3 font-semibold">
                  Categoría
                </th>
                <th
                  scope="col"
                  className="py-1 pr-3 text-right font-semibold capitalize"
                >
                  {unidad}
                </th>
                {conVariacion && (
                  <>
                    <th
                      scope="col"
                      className="py-1 pr-3 text-right font-semibold"
                    >
                      Variación
                    </th>
                    <th scope="col" className="py-1 font-semibold">
                      Tendencia
                    </th>
                  </>
                )}
              </tr>
            </thead>
            <tbody className="divide-y divide-white/5 text-ganker-text">
              {comparacion.leyenda.map((fila) => (
                <tr key={fila.clave}>
                  <td className="py-1.5 pr-3">
                    <span className="flex items-center gap-2">
                      <span
                        aria-hidden="true"
                        className="h-3 w-3 shrink-0 rounded-sm"
                        style={{ backgroundColor: fila.color }}
                      />
                      <span className="truncate">{fila.nombre}</span>
                    </span>
                  </td>
                  <td className="py-1.5 pr-3 text-right font-semibold">
                    {fila.valor}
                  </td>
                  {conVariacion && (
                    <>
                      <td className="py-1.5 pr-3 text-right">
                        {formatearVariacion(
                          fila.variation,
                          fila.variation_percentage
                        )}
                      </td>
                      <td className="py-1.5">
                        <TendenciaReporteComponent trend={fila.trend} />
                      </td>
                    </>
                  )}
                </tr>
              ))}
            </tbody>
          </table>

          {aclaracion && (
            <p className="mt-3 text-xs text-ganker-muted">{aclaracion}</p>
          )}
        </div>
      </div>
    );
  }

  return (
    <section className="rounded-2xl border border-white/10 bg-ganker-surface p-6 shadow-xl">
      <div className="mb-4 flex flex-col gap-1 sm:flex-row sm:items-baseline sm:justify-between">
        <h2 className="font-heading text-xl font-semibold text-ganker-text">
          {titulo}
        </h2>
        {ultimoResumen && !cargando && (
          <p className="text-xs text-ganker-muted">
            Generado el {formatearGeneradoEl(ultimoResumen.generated_at)}
          </p>
        )}
      </div>
      {contenido}
    </section>
  );
};

export default PanelUltimoReporteComponent;
