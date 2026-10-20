import axiosClient from "./axiosClient";

// Reportes del panel admin. Todo requiere admin u owner (require_admin en el
// backend).
const RUTA_PERFILES = "/api/v1/reports/game-profiles";
const RUTA_USO = "/api/v1/reports/game-usage";

// Exporta un reporte ya generado (no lo recalcula). `formato`: "csv", "pdf" o
// "excel". Devuelve { blob, nombreArchivo }. Como la respuesta se pide como
// blob, un error tambien llega como blob: se parsea para que quien llama vea
// el { error } del backend igual que en cualquier otro endpoint.
async function exportarReporte(ruta, reportId, formato, prefijoArchivo) {
  try {
    const response = await axiosClient.get(`${ruta}/${reportId}/export`, {
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
        : `${prefijoArchivo}_${reportId}.${extension}`,
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

// ---------------------------------------------------------
// US 37 - Reporte de jugadores (perfiles) por videojuego
// ---------------------------------------------------------

// POST -> el reporte generado (y ya guardado): items ordenados de mayor a
// menor cantidad de perfiles, con porcentaje y, si habia un reporte previo,
// variacion y tendencia ("sube" / "baja" / "estable"). Sin fechas = historico
// total. 404 si no hay perfiles; 400 si el periodo es invalido o arranca
// antes del fin del ultimo reporte.
export async function generarReportePerfiles({ start_date, end_date }) {
  const response = await axiosClient.post(RUTA_PERFILES, {
    start_date: start_date || null,
    end_date: end_date || null,
  });
  return response.data;
}

// Listado de reportes generados (id, fechas), del mas reciente al mas antiguo.
export async function obtenerReportesPerfiles() {
  const response = await axiosClient.get(RUTA_PERFILES);
  return response.data.reports;
}

// Ultimo reporte y `suggested_start_date` (dia siguiente a su fin) para
// preseleccionar un periodo valido.
export async function obtenerUltimoReportePerfiles() {
  const response = await axiosClient.get(`${RUTA_PERFILES}/last`);
  return response.data;
}

export function exportarReportePerfiles(reportId, formato) {
  return exportarReporte(RUTA_PERFILES, reportId, formato, "reporte_perfiles");
}

// ---------------------------------------------------------
// US 38 - Reporte de uso (rangos, personajes o equipos) por videojuego
// ---------------------------------------------------------

// Catalogo de tipos de analisis: [{ value, label, description,
// requires_rank_bands }]. value: "ranks" | "characters" | "teams".
export async function obtenerTiposAnalisis() {
  const response = await axiosClient.get(`${RUTA_USO}/analysis-types`);
  return response.data.analysis_types;
}

// POST -> el reporte generado. `videogame_id` null = todos los videojuegos.
// `rank_bands` ([{ min_rank_id, max_rank_id }]) solo para "teams" de un
// juego. 404 si no hay datos; 400 si el periodo o las franjas son invalidos.
export async function generarReporteUso({
  videogame_id,
  analysis_type,
  start_date,
  end_date,
  rank_bands,
}) {
  const response = await axiosClient.post(RUTA_USO, {
    videogame_id: videogame_id ? Number(videogame_id) : null,
    analysis_type,
    start_date: start_date || null,
    end_date: end_date || null,
    rank_bands: rank_bands?.length ? rank_bands : null,
  });
  return response.data;
}

// Reportes de uso generados de ese juego y tipo (o generales, sin juego).
export async function obtenerReportesUso({ videogame_id, analysis_type }) {
  const response = await axiosClient.get(RUTA_USO, {
    params: videogame_id
      ? { videogame_id: Number(videogame_id), analysis_type }
      : { analysis_type, general_only: true },
  });
  return response.data.reports;
}

// Ultimo reporte de ese juego y tipo, con su `suggested_start_date`.
export async function obtenerUltimoReporteUso({ videogame_id, analysis_type }) {
  const response = await axiosClient.get(`${RUTA_USO}/last`, {
    params: videogame_id
      ? { analysis_type, videogame_id: Number(videogame_id) }
      : { analysis_type },
  });
  return response.data;
}

export function exportarReporteUso(reportId, formato) {
  return exportarReporte(RUTA_USO, reportId, formato, "reporte_uso");
}
