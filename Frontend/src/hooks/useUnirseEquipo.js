import { useMemo, useState } from "react";
import { obtenerEquipo, unirseAEquipo } from "../api/teamApi";
import { useAuth } from "../context/AuthContext";
import { useChat } from "../context/ChatContext";
import {
  elegibilidadDelEquipo,
  mensajeDeRechazoAlUnirse,
  perfilDelJuego,
  vacantesDelEquipo,
} from "../utils/validacionesEquipos";
import { logError } from "../utils/logs";

function mensajeDeErrorAlUnirse(error, equipo) {
  const data = error.response?.data;

  if (!error.response) {
    return "No pudimos conectar con el servidor. Intentá de nuevo.";
  }

  return (
    mensajeDeRechazoAlUnirse(data?.error, equipo) ??
    mensajeDeRechazoAlUnirse(data?.detail, equipo) ??
    "Ocurrió un error al unirte al equipo. Intentá de nuevo."
  );
}

// US 18 - Unirse a equipo.
// Accion de unirse, compartida por la vista de un equipo y por las tarjetas
// de Buscar equipos (US 17): `abrir(equipo)` arranca el flujo (el modal
// para elegir vacante) y `unirse(vacanteId)` lo concreta.
//
// `alActualizarEquipo(equipo)` se llama con el estado real del equipo si la
// union fallo porque el equipo cambio (se lleno, ocuparon la vacante), para
// que la pagina refresque lo que muestra.
const useUnirseEquipo = ({ alActualizarEquipo } = {}) => {
  const { user } = useAuth();
  const { cargarConversaciones, seleccionarConversacion } = useChat();

  // Equipo al que el jugador esta intentando unirse (null = modal cerrado).
  const [equipo, setEquipo] = useState(null);
  const [uniendose, setUniendose] = useState(false);
  const [errorUnion, setErrorUnion] = useState("");

  const perfil = useMemo(
    () => perfilDelJuego(user?.profiles, equipo?.videogame?.videogame_id),
    [user, equipo]
  );
  const vacantes = useMemo(
    () => vacantesDelEquipo(equipo, perfil),
    [equipo, perfil]
  );
  const { puedeUnirse, motivo: motivoNoPuedeUnirse } =
    elegibilidadDelEquipo(equipo);

  const abrir = (equipoElegido) => {
    setErrorUnion("");
    setEquipo(equipoElegido);
  };

  const cerrar = () => {
    setErrorUnion("");
    setEquipo(null);
  };

  // Devuelve la respuesta del backend ({ message, chatroom_id, data }) o
  // null si fallo; la pagina decide a donde ir.
  const unirse = async (vacanteId) => {
    if (!equipo) return null;

    try {
      setUniendose(true);
      setErrorUnion("");

      const resultado = await unirseAEquipo(equipo.team_id, vacanteId);

      // El backend ya sumo al jugador al chatroom del equipo: se recarga la
      // lista de conversaciones para que aparezca y se abre directamente.
      await cargarConversaciones();
      seleccionarConversacion(resultado.chatroom_id);

      setEquipo(null);
      return resultado;
    } catch (error) {
      logError("Error al unirse al equipo:", error);
      setErrorUnion(mensajeDeErrorAlUnirse(error, equipo));

      if (error.response) {
        try {
          const actualizado = await obtenerEquipo(equipo.team_id);
          setEquipo(actualizado);
          alActualizarEquipo?.(actualizado);
        } catch (errorRecarga) {
          logError("Error al recargar el equipo:", errorRecarga);
        }
      }

      return null;
    } finally {
      setUniendose(false);
    }
  };

  return {
    equipo,
    vacantes,
    puedeUnirse,
    motivoNoPuedeUnirse,
    uniendose,
    errorUnion,
    abrir,
    cerrar,
    unirse,
  };
};

export default useUnirseEquipo;
