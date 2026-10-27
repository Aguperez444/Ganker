import { useEffect, useState } from "react";
import {
  obtenerDatosReportePerfiles,
  obtenerDatosReporteUso,
  obtenerReportesPerfiles,
  obtenerReportesUso,
} from "../api/reportesApi";
import { logError } from "../utils/logs";

// Reportes que se resumen en el inicio del panel admin: el ultimo de perfiles
// por videojuego y el ultimo general (todos los juegos) de cada tipo de uso.
export const REPORTES_RESUMEN = [
  {
    clave: "perfiles",
    titulo: "Perfiles por videojuego",
    unidad: "perfiles",
    listar: () => obtenerReportesPerfiles(),
    obtenerDatos: obtenerDatosReportePerfiles,
  },
  {
    clave: "ranks",
    titulo: "Rangos más usados",
    unidad: "jugadores",
    listar: () => obtenerReportesUso({ analysis_type: "ranks" }),
    obtenerDatos: obtenerDatosReporteUso,
  },
  {
    clave: "characters",
    titulo: "Personajes más elegidos",
    unidad: "jugadores",
    listar: () => obtenerReportesUso({ analysis_type: "characters" }),
    obtenerDatos: obtenerDatosReporteUso,
  },
  {
    clave: "teams",
    titulo: "Equipos",
    unidad: "equipos",
    listar: () => obtenerReportesUso({ analysis_type: "teams" }),
    obtenerDatos: obtenerDatosReporteUso,
  },
];

// Un tipo sin reportes generados devuelve null y no se muestra. Si falla uno,
// no tumba a los demas.
async function cargarReporte({ listar, obtenerDatos, ...definicion }) {
  const historial = await listar();
  const resumen = historial?.[0];
  if (!resumen) return null;

  const datos = await obtenerDatos(resumen.report_id);
  return { ...definicion, resumen, datos };
}

// Funcion de modulo por la regla set-state-in-effect (ver useGames.js).
async function cargarResumen(setEstado) {
  const resultados = await Promise.allSettled(
    REPORTES_RESUMEN.map(cargarReporte)
  );

  const fallidos = resultados.filter((r) => r.status === "rejected");
  fallidos.forEach((r) =>
    logError("Error al cargar un reporte del resumen:", r.reason)
  );

  setEstado({
    reportes: resultados
      .filter((r) => r.status === "fulfilled" && r.value?.datos?.items?.length)
      .map((r) => r.value),
    cargando: false,
    error:
      fallidos.length === resultados.length
        ? "No se pudieron cargar los últimos reportes."
        : "",
  });
}

export function useResumenReportes() {
  const [estado, setEstado] = useState({
    reportes: [],
    cargando: true,
    error: "",
  });

  useEffect(() => {
    cargarResumen(setEstado);
  }, []);

  return estado;
}
