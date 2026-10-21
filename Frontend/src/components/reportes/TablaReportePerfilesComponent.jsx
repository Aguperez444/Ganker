import IconoChicoComponent from "../common/IconoChicoComponent";
import BarraPorcentajeComponent from "./BarraPorcentajeComponent";
import BotonesExportarReporteComponent from "./BotonesExportarReporteComponent";
import TendenciaReporteComponent from "./TendenciaReporteComponent";
import {
  describirPeriodo,
  formatearGeneradoEl,
  formatearVariacion,
} from "../../utils/reportes";

// US 37 - Resultado del reporte: tabla ordenada por popularidad (ya viene
// ordenada del backend) con una barra por porcentaje como representacion
// grafica. Variacion y tendencia solo si hubo un reporte previo.
const TablaReportePerfilesComponent = ({ reporte, exportando, onExportar }) => {
  const conVariacion = reporte.has_previous_report;

  return (
    <section className="rounded-2xl border border-white/10 bg-ganker-surface p-6 shadow-xl">
      <div className="flex flex-col gap-4 sm:flex-row sm:items-start sm:justify-between">
        <div>
          <h2 className="font-heading text-xl font-semibold text-ganker-text">
            Perfiles por videojuego
          </h2>
          <p className="mt-1 text-sm text-ganker-muted">
            {describirPeriodo(reporte)} · {reporte.total_profiles} perfiles en
            total · Generado el {formatearGeneradoEl(reporte.generated_at)}
          </p>
          {conVariacion && (
            <p className="mt-1 text-xs text-ganker-muted">
              La variación se compara contra el reporte #
              {reporte.previous_report_id}.
            </p>
          )}
        </div>
        <BotonesExportarReporteComponent
          reportId={reporte.report_id}
          exportando={exportando}
          onExportar={onExportar}
        />
      </div>

      <div className="mt-6 overflow-x-auto rounded-xl border border-white/10">
        <table className="w-full min-w-[560px] text-left text-sm">
          <thead className="bg-ganker-surface-light text-xs tracking-wide text-ganker-muted uppercase">
            <tr>
              <th scope="col" className="px-4 py-3">
                #
              </th>
              <th scope="col" className="px-4 py-3">
                Videojuego
              </th>
              <th scope="col" className="px-4 py-3 text-right">
                Perfiles
              </th>
              <th scope="col" className="px-4 py-3">
                Porcentaje
              </th>
              {conVariacion && (
                <>
                  <th scope="col" className="px-4 py-3 text-right">
                    Variación
                  </th>
                  <th scope="col" className="px-4 py-3">
                    Tendencia
                  </th>
                </>
              )}
            </tr>
          </thead>
          <tbody className="divide-y divide-white/10">
            {reporte.items.map((item, indice) => {
              return (
                <tr key={item.videogame_id} className="text-ganker-text">
                  <td className="px-4 py-3 text-ganker-muted">{indice + 1}</td>
                  <td className="px-4 py-3">
                    <div className="flex items-center gap-2">
                      <IconoChicoComponent
                        src={item.icon_url}
                        className="h-7 w-7 rounded-md"
                      />
                      <span className="font-medium">{item.videogame_name}</span>
                    </div>
                  </td>
                  <td className="px-4 py-3 text-right font-semibold">
                    {item.profile_count}
                  </td>
                  <td className="px-4 py-3">
                    <BarraPorcentajeComponent porcentaje={item.percentage} />
                  </td>
                  {conVariacion && (
                    <>
                      <td className="px-4 py-3 text-right">
                        {formatearVariacion(
                          item.variation,
                          item.variation_percentage
                        )}
                      </td>
                      <td className="px-4 py-3">
                        <TendenciaReporteComponent trend={item.trend} />
                      </td>
                    </>
                  )}
                </tr>
              );
            })}
          </tbody>
        </table>
      </div>
    </section>
  );
};

export default TablaReportePerfilesComponent;
