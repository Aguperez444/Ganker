import { useEffect, useState } from "react";
import {
  eliminarEquipo,
  expulsarIntegrante,
  obtenerMiEquipo,
  transferirLiderazgo,
} from "../api/teamApi";

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

// US 43 - Mismo criterio que al expulsar: 403/404/409 y el 400 de "no
// pertenece al equipo" traen IDs internos y van con texto propio. El 400 de
// transferirse a si mismo ya viene legible y se usa tal cual.
function mensajeDeErrorAlTransferir(error) {
  const data = error.response?.data;
  const status = error.response?.status;

  if (!error.response) {
    return "No pudimos conectar con el servidor. Intentá de nuevo.";
  }
  if (status === 403) {
    return "Solo el líder del equipo puede transferir el liderazgo.";
  }
  if (status === 404) return "El equipo o el jugador ya no existen.";
  if (status === 409) return "El equipo ya no está activo.";
  if (
    typeof data?.error === "string" &&
    /no pertenece al equipo/i.test(data.error)
  ) {
    return "Ese jugador ya no forma parte del equipo.";
  }
  if (typeof data?.error === "string") return data.error;
  if (typeof data?.detail === "string") return data.detail;

  return "Ocurrió un error al transferir el liderazgo. Intentá de nuevo.";
}

// US 16 - El 403 trae IDs internos; el 404 significa que ya no existe.
function mensajeDeErrorAlEliminar(error) {
  const data = error.response?.data;
  const status = error.response?.status;

  if (!error.response) {
    return "No pudimos conectar con el servidor. Intentá de nuevo.";
  }
  if (status === 403) return "Solo el líder del equipo puede eliminarlo.";
  if (status === 404) return "El equipo ya no existe.";
  if (typeof data?.error === "string") return data.error;
  if (typeof data?.detail === "string") return data.detail;

  return "Ocurrió un error al eliminar el equipo. Intentá de nuevo.";
}

// Equipo activo del jugador logueado (null si no esta en ninguno).
const useMiEquipo = () => {
  const [equipo, setEquipo] = useState(null);
  const [cargando, setCargando] = useState(true);
  const [error, setError] = useState("");

  const [expulsando, setExpulsando] = useState(false);
  const [errorExpulsion, setErrorExpulsion] = useState("");

  const [transfiriendo, setTransfiriendo] = useState(false);
  const [errorTransferencia, setErrorTransferencia] = useState("");

  const [eliminando, setEliminando] = useState(false);
  const [errorEliminacion, setErrorEliminacion] = useState("");

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

  // US 43 - Devuelve el mensaje de confirmacion del backend, o null si fallo.
  const transferir = async (usuarioId) => {
    if (!equipo) return null;

    try {
      setTransfiriendo(true);
      setErrorTransferencia("");

      const resultado = await transferirLiderazgo(equipo.team_id, usuarioId);

      // Refrescamos desde el GET (fuente de verdad, igual que al expulsar):
      // cambian la etiqueta de lider y los permisos de quien mira.
      await cargarMiEquipo({ setEquipo, setCargando, setError });

      return resultado.message;
    } catch (error) {
      console.error("Error al transferir el liderazgo:", error);
      setErrorTransferencia(mensajeDeErrorAlTransferir(error));

      // El equipo cambio por debajo (el jugador salio, ya no somos lider):
      // se muestra el estado real.
      const status = error.response?.status;
      if (status === 400 || status === 403 || status === 404) {
        await cargarMiEquipo({ setEquipo, setCargando, setError });
      }

      return null;
    } finally {
      setTransfiriendo(false);
    }
  };

  const limpiarErrorTransferencia = () => {
    setErrorTransferencia("");
  };

  // US 16 - Devuelve el mensaje de confirmacion del backend, o null si fallo.
  // Quien llama decide a donde ir (el equipo ya no existe).
  const eliminar = async () => {
    if (!equipo) return null;

    try {
      setEliminando(true);
      setErrorEliminacion("");

      const resultado = await eliminarEquipo(equipo.team_id);
      return resultado.message;
    } catch (error) {
      console.error("Error al eliminar el equipo:", error);
      setErrorEliminacion(mensajeDeErrorAlEliminar(error));

      // Ya no es lider o el equipo ya no existe: se muestra el estado real.
      const status = error.response?.status;
      if (status === 403 || status === 404) {
        await cargarMiEquipo({ setEquipo, setCargando, setError });
      }

      return null;
    } finally {
      setEliminando(false);
    }
  };

  const limpiarErrorEliminacion = () => {
    setErrorEliminacion("");
  };

  return {
    equipo,
    cargando,
    error,
    expulsando,
    errorExpulsion,
    expulsarIntegrante: expulsar,
    limpiarErrorExpulsion,
    transfiriendo,
    errorTransferencia,
    transferirLiderazgo: transferir,
    limpiarErrorTransferencia,
    eliminando,
    errorEliminacion,
    eliminarEquipo: eliminar,
    limpiarErrorEliminacion,
  };
};

export default useMiEquipo;
