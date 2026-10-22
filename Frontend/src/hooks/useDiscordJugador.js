import { useEffect, useState } from "react";
import { getPlayerDiscord } from "../api/discordApi";
import { logError } from "../utils/logs";

// Funcion de modulo por el mismo motivo que cargarEquipo en useEquipo.js
// (regla set-state-in-effect).
async function cargarDiscord({ userId, setEstado }) {
  try {
    setEstado({ userId, cuenta: await getPlayerDiscord(userId) });
  } catch (error) {
    // Es un dato extra del perfil: si falla, simplemente no se muestra
    logError("Error al cargar el Discord del jugador:", error);
    setEstado({ userId, cuenta: null });
  }
}

// Discord de otro jugador (ver DiscordJugadorComponent). Devuelve la cuenta
// solo si corresponde al `userId` actual, para no mostrar la del perfil
// anterior mientras carga la nueva.
function useDiscordJugador(userId) {
  const [estado, setEstado] = useState({ userId: null, cuenta: null });

  useEffect(() => {
    cargarDiscord({ userId, setEstado });
  }, [userId]);

  return estado.userId === userId ? estado.cuenta : null;
}

export default useDiscordJugador;
