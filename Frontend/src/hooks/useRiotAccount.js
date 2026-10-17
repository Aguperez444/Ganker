import { useCallback, useEffect, useState } from "react";
import {
  getRiotAccount,
  linkRiotAccount,
  refreshRiotStats,
  unlinkRiotAccount,
} from "../api/riotApi";
import { logError } from "../utils/logs";

function mensajeDeError(error, porDefecto) {
  return error.response?.data?.error ?? porDefecto;
}

// Funcion de modulo por el mismo motivo que cargarEquipo en useEquipo.js
// (regla set-state-in-effect).
async function cargarCuenta({ gameProfileId, setEstado }) {
  try {
    const cuenta = await getRiotAccount(gameProfileId);
    setEstado({ gameProfileId, cuenta, error: "" });
  } catch (error) {
    logError("Error al cargar la cuenta de Riot:", error);
    setEstado({
      gameProfileId,
      cuenta: null,
      error: "No se pudieron cargar los datos de la cuenta de Riot.",
    });
  }
}

// Cuenta de Riot de un perfil de juego (solo LoL). `onRangoActualizado` se
// llama cuando vincular o actualizar cambio el rango del perfil, para que
// quien muestra el perfil lo vuelva a pedir.
const useRiotAccount = (gameProfileId, { onRangoActualizado } = {}) => {
  const [estado, setEstado] = useState({
    gameProfileId: null,
    cuenta: null,
    error: "",
  });
  const [accionEnCurso, setAccionEnCurso] = useState(null);
  const [errorAccion, setErrorAccion] = useState("");
  const [mensaje, setMensaje] = useState("");

  useEffect(() => {
    cargarCuenta({ gameProfileId, setEstado });
  }, [gameProfileId]);

  const cargando = estado.gameProfileId !== gameProfileId;

  const ejecutar = useCallback(async (accion, llamada, errorPorDefecto) => {
    try {
      setAccionEnCurso(accion);
      setErrorAccion("");
      setMensaje("");

      const resultado = await llamada();
      return resultado;
    } catch (error) {
      setErrorAccion(mensajeDeError(error, errorPorDefecto));
      return null;
    } finally {
      setAccionEnCurso(null);
    }
  }, []);

  const aplicarResultado = (cuenta, mensajeSinRango) => {
    setEstado({ gameProfileId, cuenta, error: "" });
    if (cuenta.rank_sync) {
      setMensaje(cuenta.rank_sync.message);
      if (cuenta.rank_sync.status === "updated") onRangoActualizado?.();
    } else if (mensajeSinRango) {
      setMensaje(mensajeSinRango);
    }
  };

  const vincular = async ({ riotId, server }) => {
    const cuenta = await ejecutar(
      "vincular",
      () => linkRiotAccount(gameProfileId, { riotId, server }),
      "No se pudo vincular la cuenta de Riot."
    );
    // Sin estadisticas (Valorant) no hay rango que informar
    if (cuenta) aplicarResultado(cuenta, "Cuenta de Riot vinculada.");
    return Boolean(cuenta);
  };

  const actualizar = async () => {
    const cuenta = await ejecutar(
      "actualizar",
      () => refreshRiotStats(gameProfileId),
      "No se pudieron actualizar las estadísticas."
    );
    if (cuenta) aplicarResultado(cuenta);
    return Boolean(cuenta);
  };

  const desvincular = async () => {
    const respuesta = await ejecutar(
      "desvincular",
      () => unlinkRiotAccount(gameProfileId),
      "No se pudo desvincular la cuenta de Riot."
    );
    if (!respuesta) return false;

    // Se conservan requires_server y provides_stats para volver a mostrar el
    // formulario correcto (con o sin servidor)
    setEstado((anterior) => ({
      gameProfileId,
      cuenta: {
        ...anterior.cuenta,
        linked: false,
        riot_id: null,
        server: null,
        stats: null,
        rank_sync: null,
      },
      error: "",
    }));
    setMensaje(respuesta.message);
    return true;
  };

  return {
    cuenta: cargando ? null : estado.cuenta,
    cargando,
    error: cargando ? "" : estado.error,
    accionEnCurso,
    errorAccion,
    mensaje,
    vincular,
    actualizar,
    desvincular,
  };
};

export default useRiotAccount;
