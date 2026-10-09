import { useEffect, useState } from "react";
import { obtenerMiEquipo } from "../api/teamApi";

// Funcion de modulo por el mismo motivo que cargarVideojuegos en useGames.js
// (regla set-state-in-effect).
async function cargarMiEquipo({ setEquipo, setCargando, setError }) {
  try {
    setEquipo(await obtenerMiEquipo());
  } catch (error) {
    console.error("Error al cargar el equipo del jugador:", error);
    setError("No se pudo cargar tu equipo.");
  } finally {
    setCargando(false);
  }
}

// Equipo activo del jugador logueado (null si no esta en ninguno).
const useMiEquipo = () => {
  const [equipo, setEquipo] = useState(null);
  const [cargando, setCargando] = useState(true);
  const [error, setError] = useState("");

  useEffect(() => {
    cargarMiEquipo({ setEquipo, setCargando, setError });
  }, []);

  return { equipo, cargando, error };
};

export default useMiEquipo;
