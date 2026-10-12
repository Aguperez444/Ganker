import { useCallback, useEffect, useState } from "react";
import { obtenerEquipo } from "../api/teamApi";
import { logError } from "../utils/logs";

// Funcion de modulo por el mismo motivo que cargarVideojuegos en useGames.js
// (regla set-state-in-effect).
async function cargarEquipo({ equipoId, setEquipo, setCargando, setError }) {
  try {
    setError("");
    setEquipo(await obtenerEquipo(equipoId));
  } catch (error) {
    logError("Error al cargar el equipo:", error);
    setEquipo(null);
    setError(
      error.response?.status === 404
        ? "El equipo no existe."
        : "No se pudo cargar el equipo."
    );
  } finally {
    setCargando(false);
  }
}

// Un equipo puntual por id (vista de un equipo ajeno, US 18).
// `reemplazarEquipo` deja poner el estado que devuelve el backend tras una
// accion (ej. al fallar una union) sin volver a pedirlo.
const useEquipo = (equipoId) => {
  const [equipo, setEquipo] = useState(null);
  const [cargando, setCargando] = useState(true);
  const [error, setError] = useState("");

  const recargar = useCallback(
    () => cargarEquipo({ equipoId, setEquipo, setCargando, setError }),
    [equipoId]
  );

  useEffect(() => {
    recargar();
  }, [recargar]);

  return { equipo, cargando, error, reemplazarEquipo: setEquipo };
};

export default useEquipo;
