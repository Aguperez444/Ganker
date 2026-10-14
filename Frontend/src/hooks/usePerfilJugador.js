import { useEffect, useState } from "react";
import { obtenerPerfilJugador } from "../api/jugadoresApi";
import { logError } from "../utils/logs";

// Funcion de modulo por el mismo motivo que cargarEquipo en useEquipo.js
// (regla set-state-in-effect).
async function cargarPerfil({ jugadorId, setEstado }) {
  try {
    const perfil = await obtenerPerfilJugador(jugadorId);
    setEstado({ jugadorId, perfil, error: "" });
  } catch (error) {
    logError("Error al cargar el perfil del jugador:", error);
    setEstado({
      jugadorId,
      perfil: null,
      error:
        error.response?.status === 404
          ? "Este jugador no existe."
          : "No se pudo cargar el perfil del jugador.",
    });
  }
}

// Perfil de otro jugador por id (se entra desde Buscar jugadores, el chat o
// un equipo). La pagina no se desmonta al pasar de un perfil a otro (ej.
// desde el chat), asi que el resultado se guarda junto al id que se pidio:
// mientras no coincida con el actual, se considera que esta cargando y no se
// muestra el perfil anterior.
const usePerfilJugador = (jugadorId) => {
  const [estado, setEstado] = useState({
    jugadorId: null,
    perfil: null,
    error: "",
  });

  useEffect(() => {
    cargarPerfil({ jugadorId, setEstado });
  }, [jugadorId]);

  const cargando = estado.jugadorId !== jugadorId;

  return {
    perfil: cargando ? null : estado.perfil,
    cargando,
    error: cargando ? "" : estado.error,
  };
};

export default usePerfilJugador;
