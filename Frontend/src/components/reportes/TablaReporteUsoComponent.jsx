import IconoChicoComponent from "../common/IconoChicoComponent";
import BarraPorcentajeComponent from "./BarraPorcentajeComponent";
import BotonesExportarReporteComponent from "./BotonesExportarReporteComponent";
import TendenciaReporteComponent from "./TendenciaReporteComponent";
import {
  describirPeriodo,
  formatearGeneradoEl,
  formatearVariacion,
} from "../../utils/reportes";

// Encabezados segun el tipo de analisis. En "teams" general (todos los
// juegos) cada fila es un videojuego; con un juego, cada fila es una franja.
function columnasPara(reporte) {
  const general = reporte.videogame_id === null;
  if (reporte.analysis_type === "teams") {
    return {
      titulo: "Franjas de rangos con más equipos",
      categoria: general ? "Videojuego" : "Franja de rangos",
      cantidad: "Equipos",
      total: "equipos",
    };
  }
  if (reporte.analysis_type === "characters") {
    return {
      titulo: "Personajes más utilizados",
      categoria: "Personaje",
      cantidad: "Jugadores",
      total: "perfiles",
    };
  }
  return {
    titulo: "Distribución por rangos",
    categoria: "Rango",
    cantidad: "Jugadores",
    total: "perfiles",
  };
}

// US 38 - Resultado del reporte de uso: tabla (ya ordenada de mayor a menor
// por el backend) con barra por porcentaje. Variacion y tendencia solo si
// hubo un reporte previo del mismo tipo y videojuego.
const TablaReporteUsoComponent = ({ reporte, exportando, onExportar }) => {
  const columnas = columnasPara(reporte);
  const conVariacion = reporte.has_previous_report;
  // En rangos y personajes un perfil puede contar en varias filas.
  const puedeSuperponerse = reporte.analysis_type !== "teams";

  return (
    <section className="rounded-2xl border border-white/10 bg-ganker-surface p-6 shadow-xl">
      <div className="flex flex-col gap-4 sm:flex-row sm:items-start sm:justify-between">
        <div>
          <h2 className="font-heading text-xl font-semibold text-ganker-text">
            {columnas.titulo} · {reporte.videogame_name}
          </h2>
          <p className="mt-1 text-sm text-ganker-muted">
            {describirPeriodo(reporte)} · {reporte.total} {columnas.total} en
            total · Generado el {formatearGeneradoEl(reporte.generated_at)}
          </p>
          {puedeSuperponerse && (
            <p className="mt-1 text-xs text-ganker-muted">
              Un perfil puede contar en más de una fila, así que los porcentajes
              pueden sumar más de 100%.
            </p>
          )}
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
                {columnas.categoria}
              </th>
              <th scope="col" className="px-4 py-3 text-right">
                {columnas.cantidad}
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
            {reporte.items.map((item, indice) => (
              <tr
                key={item.category_id ?? item.rank_range ?? item.name}
                className="text-ganker-text"
              >
                <td className="px-4 py-3 text-ganker-muted">{indice + 1}</td>
                <td className="px-4 py-3">
                  <div className="flex items-center gap-2">
                    {item.icon_url && (
                      <IconoChicoComponent
                        src={item.icon_url}
                        className="h-7 w-7 rounded-md"
                      />
                    )}
                    <span className="font-medium">{item.name}</span>
                  </div>
                </td>
                <td className="px-4 py-3 text-right font-semibold">
                  {item.count}
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
            ))}
          </tbody>
        </table>
      </div>
    </section>
  );
};

export default TablaReporteUsoComponent;
