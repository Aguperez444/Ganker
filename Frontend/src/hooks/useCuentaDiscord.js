import { useEffect, useState } from "react";
import {
  getDiscordAuthorizeUrl,
  getMyDiscord,
  unlinkDiscord,
  updateDiscordVisibility,
} from "../api/discordApi";
import {
  VISIBILIDAD_POR_DEFECTO,
  guardarVisibilidadPendiente,
  tomarMensajeDiscord,
} from "../utils/discord";
import { logError } from "../utils/logs";

function mensajeDeError(error, porDefecto) {
  return error.response?.data?.error ?? porDefecto;
}

// Funcion de modulo por el mismo motivo que cargarEquipo en useEquipo.js
// (regla set-state-in-effect).
async function cargarCuenta({ setCuenta, setError }) {
  try {
    setCuenta(await getMyDiscord());
  } catch (error) {
    logError("Error al cargar la cuenta de Discord:", error);
    setCuenta({ linked: false });
    setError("No se pudo cargar tu cuenta de Discord.");
  }
}

// Estado y acciones de la seccion "Discord" de Mi cuenta (ver
// CuentaDiscordComponent): conectar, cambiar la visibilidad y desconectar.
function useCuentaDiscord() {
  const [cuenta, setCuenta] = useState(null);
  const [visibilidad, setVisibilidad] = useState(VISIBILIDAD_POR_DEFECTO);
  const [enCurso, setEnCurso] = useState(false);
  const [error, setError] = useState("");
  const [mensaje, setMensaje] = useState(() => tomarMensajeDiscord());

  useEffect(() => {
    cargarCuenta({ setCuenta, setError });
  }, []);

  const conectar = async () => {
    try {
      setEnCurso(true);
      setError("");
      const url = await getDiscordAuthorizeUrl();
      guardarVisibilidadPendiente(visibilidad);
      window.location.assign(url);
    } catch (error) {
      setError(
        mensajeDeError(error, "No se pudo iniciar la conexión con Discord.")
      );
      setEnCurso(false);
    }
  };

  const cambiarVisibilidad = async (nueva) => {
    try {
      setEnCurso(true);
      setError("");
      setMensaje(null);
      setCuenta(await updateDiscordVisibility(nueva));
      setMensaje({
        tipo: "exito",
        texto: "Se actualizó quién puede ver tu Discord.",
      });
    } catch (error) {
      setError(mensajeDeError(error, "No se pudo cambiar la visibilidad."));
    } finally {
      setEnCurso(false);
    }
  };

  const desconectar = async () => {
    try {
      setEnCurso(true);
      setError("");
      setMensaje(null);
      const respuesta = await unlinkDiscord();
      setCuenta({ linked: false });
      setMensaje({ tipo: "exito", texto: respuesta.message });
    } catch (error) {
      setError(mensajeDeError(error, "No se pudo desconectar Discord."));
    } finally {
      setEnCurso(false);
    }
  };

  return {
    cuenta,
    visibilidad,
    setVisibilidad,
    enCurso,
    error,
    mensaje,
    conectar,
    cambiarVisibilidad,
    desconectar,
  };
}

export default useCuentaDiscord;
