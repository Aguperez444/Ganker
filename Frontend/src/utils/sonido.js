let ultimaReproduccion = 0;
const ENFRIAMIENTO_MS = 1500;

/**
 * Sonido de aviso cuando llega un mensaje de una conversacion que el jugador
 * NO esta viendo en ese momento (ver ChatContext.manejarNotificacion).
 * Archivo estatico en Public/sounds/, tiene un enfriamiento para no
 * saturar de sonido si llegan varios mensajes seguidos.
 */
export function reproducirSonidoNotificacion() {
  if (typeof Audio === "undefined") return;

  const ahora = Date.now();
  if (ahora - ultimaReproduccion < ENFRIAMIENTO_MS) return;
  ultimaReproduccion = ahora;

  try {
    const audio = new Audio("/sounds/notification_ganker.mp3");
    audio.play()?.catch(() => {
      // El navegador puede bloquear el autoplay si el jugador todavia no
      // interactuo con la pestaña. No es un error que haga falta mostrar.
    });
  } catch {
    // Entorno sin soporte de audio (ej. algunos tests). No es critico.
  }
}
