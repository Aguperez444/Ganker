import { useCallback, useEffect, useState } from "react";
import { obtenerJugadoresBaneados } from "../api/moderacionApi";
import { logError } from "../utils/logs";

// Funcion de modulo por el mismo motivo que cargarEquipo en useEquipo.js
// (regla set-state-in-effect).
async function cargarBaneados({ setEstado, filtros }) {
  setEstado((actual) => ({ ...actual, cargando: true, error: "" }));

  try {
    const baneados = await obtenerJugadoresBaneados(filtros);
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
// `recargar({ username })` filtra por nombre de usuario en el backend.
export function useJugadoresBaneados() {
  const [estado, setEstado] = useState({
    baneados: [],
    cargando: true,
    error: "",
  });

  useEffect(() => {
    cargarBaneados({ setEstado });
  }, []);

  // Despues de banear o desbanear, o al filtrar por username.
  const recargar = useCallback(
    (filtros) => cargarBaneados({ setEstado, filtros }),
    []
  );

  return { ...estado, recargar };
}
