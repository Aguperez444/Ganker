import { useEffect, useState } from "react";
import { logError } from "../utils/logs";

// Funcion de modulo por la regla set-state-in-effect (ver useGames.js).
async function cargarComparacion({
  clave,
  ultimoId,
  anteriorId,
  obtenerDatos,
  setEstado,
}) {
  try {
    const [ultimo, anterior] = await Promise.all([
      obtenerDatos(ultimoId),
      anteriorId ? obtenerDatos(anteriorId) : Promise.resolve(null),
    ]);
    setEstado({ clave, ultimo, anterior, error: "" });
  } catch (error) {
    logError("Error al cargar los datos de los últimos reportes:", error);
    setEstado({
      clave,
      ultimo: null,
      anterior: null,
      error: "No se pudieron cargar los datos del último reporte.",
    });
  }
}

// Datos ({ items, total }) del ultimo reporte y del anterior, para el panel
// de tortas de Admin > Reportes. `historial` viene del mas reciente al mas
// antiguo, asi que son sus dos primeros. Se recarga solo cuando cambian esos
// ids (ej. al generar uno nuevo). `obtenerDatos(reportId)` sale de
// reportesApi (perfiles o uso).
export function useComparacionUltimosReportes(historial, obtenerDatos) {
  const ultimoId = historial?.[0]?.report_id ?? null;
  const anteriorId = historial?.[1]?.report_id ?? null;
  const clave = `${ultimoId}|${anteriorId}`;

  const [estado, setEstado] = useState({
    clave: null,
    ultimo: null,
    anterior: null,
    error: "",
  });

  useEffect(() => {
    if (ultimoId) {
      cargarComparacion({
        clave,
        ultimoId,
        anteriorId,
        obtenerDatos,
        setEstado,
      });
    }
  }, [clave, ultimoId, anteriorId, obtenerDatos]);

  const cargando = Boolean(ultimoId) && estado.clave !== clave;
  const vigente = estado.clave === clave;

  return {
    hayReporte: Boolean(ultimoId),
    cargando,
    ultimoResumen: historial?.[0] ?? null,
    anteriorResumen: historial?.[1] ?? null,
    ultimo: vigente ? estado.ultimo : null,
    anterior: vigente ? estado.anterior : null,
    error: vigente ? estado.error : "",
  };
}
