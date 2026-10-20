import axiosClient from "./axiosClient";

// US 37 - Reporte de jugadores (perfiles) por videojuego. Todo requiere admin
// u owner (require_admin en el backend).
const RUTA = "/api/v1/reports/game-profiles";

// POST -> el reporte generado (y ya guardado): items ordenados de mayor a
// menor cantidad de perfiles, con porcentaje y, si habia un reporte previo,
// variacion y tendencia ("sube" / "baja" / "estable"). Sin fechas = historico
// total. 404 si no hay perfiles; 400 si el periodo es invalido o arranca
// antes del fin del ultimo reporte.
export async function generarReportePerfiles({ start_date, end_date }) {
  const response = await axiosClient.post(RUTA, {
    start_date: start_date || null,
    end_date: end_date || null,
  });
  return response.data;
}

// Listado de reportes generados (id, fechas), del mas reciente al mas antiguo.
export async function obtenerReportesPerfiles() {
  const response = await axiosClient.get(RUTA);
  return response.data.reports;
}

// Ultimo reporte y `suggested_start_date` (dia siguiente a su fin) para
// preseleccionar un periodo valido.
export async function obtenerUltimoReportePerfiles() {
  const response = await axiosClient.get(`${RUTA}/last`);
  return response.data;
}

// Exporta un reporte ya generado (no lo recalcula). `formato`: "csv", "pdf" o
// "excel". Devuelve { blob, nombreArchivo }. Como la respuesta se pide como
// blob, un error tambien llega como blob: se parsea para que quien llama vea
// el { error } del backend igual que en cualquier otro endpoint.
export async function exportarReportePerfiles(reportId, formato) {
  try {
    const response = await axiosClient.get(`${RUTA}/${reportId}/export`, {
      params: { report_output_format: formato },
      responseType: "blob",
    });
    const disposition = response.headers?.["content-disposition"] ?? "";
    const nombreCodificado = disposition.match(
      /filename\*=UTF-8''([^;]+)/i
    )?.[1];
    const extension = formato === "excel" ? "xlsx" : formato;

    return {
      blob: response.data,
      nombreArchivo: nombreCodificado
        ? decodeURIComponent(nombreCodificado)
        : `reporte_perfiles_${reportId}.${extension}`,
    };
  } catch (error) {
    if (error.response?.data instanceof Blob) {
      try {
        error.response.data = JSON.parse(await error.response.data.text());
      } catch {
        // Si no es JSON, quien llama usa su mensaje por defecto.
      }
    }
    throw error;
  }
}
