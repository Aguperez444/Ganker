import { useCallback, useEffect, useState } from "react";
import {
  exportarReportePerfiles,
  generarReportePerfiles,
  obtenerDatosReportePerfiles,
  obtenerReportesPerfiles,
  obtenerUltimoReportePerfiles,
} from "../api/reportesApi";
import { useComparacionUltimosReportes } from "./useComparacionUltimosReportes";
import { descargarArchivo } from "../utils/descargas";
import { logError } from "../utils/logs";
import { validarPeriodoReporte } from "../utils/reportes";

function mensajeDeError(error, porDefecto) {
  if (!error.response) {
    return "No pudimos conectar con el servidor. Intentá de nuevo.";
  }
  const data = error.response.data;
  if (typeof data?.error === "string") return data.error;
  if (typeof data?.detail === "string") return data.detail;
  if (error.response.status === 403) {
    return "No tenés permisos para acceder a los reportes.";
  }
  return porDefecto;
}

// Funcion de modulo (no un useCallback del componente) por la regla
// set-state-in-effect, igual que cargarVideojuegos en useGames.js.
async function cargarAntecedentes({ setEstado, setFechaInicio }) {
  try {
    const [ultimo, historial] = await Promise.all([
      obtenerUltimoReportePerfiles(),
      obtenerReportesPerfiles(),
    ]);
    setEstado({
      cargando: false,
      ultimo,
      historial: historial ?? [],
      error: "",
    });
    // Preselecciona el primer dia valido despues del ultimo reporte.
    if (ultimo?.suggested_start_date) {
      setFechaInicio((actual) => actual || ultimo.suggested_start_date);
    }
  } catch (error) {
    logError("Error al cargar los reportes previos:", error);
    setEstado({
      cargando: false,
      ultimo: null,
      historial: [],
      error: mensajeDeError(
        error,
        "No se pudieron cargar los reportes previos."
      ),
    });
  }
}

// US 37 - Generar reporte de jugadores por videojuego.
export function useReportePerfilesPorJuego() {
  const [fechaInicio, setFechaInicio] = useState("");
  const [fechaFin, setFechaFin] = useState("");

  const [estado, setEstado] = useState({
    cargando: true,
    ultimo: null,
    historial: [],
    error: "",
  });

  const [reporte, setReporte] = useState(null);
  const [generando, setGenerando] = useState(false);
  const [errorGenerar, setErrorGenerar] = useState("");

  // Que reporte y formato se esta exportando, ej. "12-pdf".
  const [exportando, setExportando] = useState(null);
  const [errorExportar, setErrorExportar] = useState("");

  const recargarAntecedentes = useCallback(
    () => cargarAntecedentes({ setEstado, setFechaInicio }),
    []
  );

  useEffect(() => {
    recargarAntecedentes();
  }, [recargarAntecedentes]);

  const inicioMinimo = estado.ultimo?.suggested_start_date ?? null;

  async function generar() {
    setErrorGenerar("");
    setErrorExportar("");

    const errorPeriodo = validarPeriodoReporte({
      fechaInicio,
      fechaFin,
      inicioMinimo,
    });
    if (errorPeriodo) {
      setErrorGenerar(errorPeriodo);
      return false;
    }

    try {
      setGenerando(true);
      const nuevo = await generarReportePerfiles({
        start_date: fechaInicio,
        end_date: fechaFin,
      });
      setReporte(nuevo);
      // El nuevo pasa a ser el "ultimo": cambia el inicio minimo y el historial.
      setFechaInicio("");
      setFechaFin("");
      await recargarAntecedentes();
      return true;
    } catch (error) {
      logError("Error al generar el reporte:", error);
      setErrorGenerar(
        mensajeDeError(error, "Ocurrió un error al generar el reporte.")
      );
      return false;
    } finally {
      setGenerando(false);
    }
  }

  async function exportar(reportId, formato) {
    setErrorExportar("");
    try {
      setExportando(`${reportId}-${formato}`);
      const { blob, nombreArchivo } = await exportarReportePerfiles(
        reportId,
        formato
      );
      descargarArchivo(blob, nombreArchivo);
    } catch (error) {
      logError("Error al exportar el reporte:", error);
      setErrorExportar(
        mensajeDeError(error, "No se pudo exportar el reporte.")
      );
    } finally {
      setExportando(null);
    }
  }

  // Tortas del ultimo reporte y el anterior (panel fijo arriba de la page).
  const comparacion = useComparacionUltimosReportes(
    estado.historial,
    obtenerDatosReportePerfiles
  );

  return {
    fechaInicio,
    fechaFin,
    setFechaInicio,
    setFechaFin,
    inicioMinimo,

    comparacion: {
      ...comparacion,
      cargando: estado.cargando || comparacion.cargando,
    },

    cargandoAntecedentes: estado.cargando,
    ultimo: estado.ultimo,
    historial: estado.historial,
    errorAntecedentes: estado.error,

    reporte,
    generando,
    errorGenerar,
    generar,

    exportando,
    errorExportar,
    exportar,
  };
}
