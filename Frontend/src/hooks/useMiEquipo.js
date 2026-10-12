import { useEffect, useState } from "react";
import { expulsarIntegrante, obtenerMiEquipo } from "../api/teamApi";

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

// Los mensajes de dominio de 403/404/409 traen IDs internos, por eso esos
// status van con un texto propio. El 400 (autoexpulsion o jugador que ya no
// esta en el equipo) usa el mensaje del backend.
function mensajeDeErrorAlExpulsar(error) {
  const data = error.response?.data;
  const status = error.response?.status;

  if (status === 403) {
    return "Solo el líder del equipo puede expulsar integrantes.";
  }
  if (status === 404) {
    return "El equipo o el jugador ya no existen.";
  }
  if (status === 409) return "El equipo ya no está activo.";
  if (typeof data?.error === "string") return data.error;
  if (typeof data?.detail === "string") return data.detail;

  return "Ocurrió un error al expulsar al jugador. Intentá de nuevo.";
}

// Equipo activo del jugador logueado (null si no esta en ninguno).
const useMiEquipo = () => {
  const [equipo, setEquipo] = useState(null);
  const [cargando, setCargando] = useState(true);
  const [error, setError] = useState("");

  const [expulsando, setExpulsando] = useState(false);
  const [errorExpulsion, setErrorExpulsion] = useState("");

  useEffect(() => {
    cargarMiEquipo({ setEquipo, setCargando, setError });
  }, []);

  // Devuelve true/false y la pagina decide que mostrar (modal, banner).
  const expulsar = async (usuarioId) => {
    if (!equipo) return false;

    try {
      setExpulsando(true);
      setErrorExpulsion("");

      await expulsarIntegrante(equipo.team_id, usuarioId);

      // Refrescamos desde el GET (fuente de verdad) para que el cupo vuelva
      // como vacante y baje el contador de integrantes.
      await cargarMiEquipo({ setEquipo, setCargando, setError });

      return true;
    } catch (error) {
      console.error("Error al expulsar al integrante:", error);
      setErrorExpulsion(mensajeDeErrorAlExpulsar(error));

      // Con 400/404 lo mas probable es que el equipo haya cambiado (el
      // jugador ya salio, o el equipo ya no existe): mostramos el estado real.
      const status = error.response?.status;
      if (status === 400 || status === 404) {
        await cargarMiEquipo({ setEquipo, setCargando, setError });
      }

      return false;
    } finally {
      setExpulsando(false);
    }
  };

  const limpiarErrorExpulsion = () => {
    setErrorExpulsion("");
  };

  return {
    equipo,
    cargando,
    error,
    expulsando,
    errorExpulsion,
    expulsarIntegrante: expulsar,
    limpiarErrorExpulsion,
  };
};

export default useMiEquipo;
