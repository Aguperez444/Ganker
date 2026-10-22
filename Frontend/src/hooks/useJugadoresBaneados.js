import { useCallback, useEffect, useState } from "react";
import { obtenerJugadoresBaneados } from "../api/moderacionApi";
import { logError } from "../utils/logs";

// Funcion de modulo por el mismo motivo que cargarEquipo en useEquipo.js
// (regla set-state-in-effect).
async function cargarBaneados({ setEstado }) {
  setEstado((actual) => ({ ...actual, cargando: true, error: "" }));

  try {
    const baneados = await obtenerJugadoresBaneados();
    setEstado({ baneados, cargando: false, error: "" });
  } catch (error) {
    logError("Error al cargar los baneos:", error);
    setEstado((actual) => ({
      ...actual,
      cargando: false,
      error:
        error.response?.status === 403
          ? "No tenés permisos para ver los baneos."
          : "No se pudo cargar la lista de baneados.",
    }));
  }
}

// US 53 - Listado de jugadores baneados (admin), para poder levantar la
// suspension desde Admin > Moderacion.
//
// El estado de baneo lo resuelve el backend: aca solo se muestra lo que
// devuelve el endpoint, sin filtrar ni cruzar registros en el front.
export function useJugadoresBaneados() {
  const [estado, setEstado] = useState({
    baneados: [],
    cargando: true,
    error: "",
  });

  useEffect(() => {
    cargarBaneados({ setEstado });
  }, []);

  // Despues de banear o desbanear, para reflejar el cambio.
  const recargar = useCallback(() => cargarBaneados({ setEstado }), []);

  return { ...estado, recargar };
}
