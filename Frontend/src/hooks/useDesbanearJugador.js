import { useState } from "react";
import { desbanearJugador } from "../api/moderacionApi";
import { logError } from "../utils/logs";
import { mensajeDeErrorDesbaneo } from "../utils/baneos";

// US 36 - Desbanear jugador a mano (admin).
//
// `baneo` es la fila del listado de baneos que se está por levantar
// ({ banned_user_id, banned_user_username, ... }); mientras no es null, el
// modal de confirmación está abierto.
//
// Devuelve el mensaje de éxito para que la pantalla lo muestre y refresque el
// listado. El backend se encarga de reactivar la cuenta.
export function useDesbanearJugador() {
  const [baneo, setBaneo] = useState(null);
  const [cargando, setCargando] = useState(false);
  const [error, setError] = useState("");

  function abrir(otro) {
    setError("");
    setBaneo(otro);
  }

  function cancelar() {
    setError("");
    setBaneo(null);
  }

  // Devuelve el mensaje de éxito, o null si no se desbaneó.
  async function confirmar() {
    if (!baneo) return null;

    const jugadorId = baneo.banned_user_id;
    const username = baneo.banned_user_username;

    try {
      setCargando(true);
      setError("");

      await desbanearJugador(jugadorId);

      setBaneo(null);
      return `La cuenta de @${username} fue desbaneada correctamente.`;
    } catch (error) {
      logError("Error al desbanear al jugador:", error);
      setError(mensajeDeErrorDesbaneo(error));
      return null;
    } finally {
      setCargando(false);
    }
  }

  return {
    baneo,
    cargando,
    error,
    abrir,
    cancelar,
    confirmar,
  };
}
