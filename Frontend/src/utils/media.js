/**
 * El backend devuelve las imagenes como ruta relativa ("/media/..."). Si la
 * usaramos tal cual en un <img>, el navegador la resolveria contra el server
 * de Vite (:5173) en vez de contra la API (:8000) y daria 404.
 *
 * Devuelve null cuando no hay ruta o cuando el backend devuelve un placeholder
 * ("Sin icono", "sin_icon"), para que quien la use pueda decidir su propio fallback.
 */
export function urlDeMedia(ruta) {
  if (!ruta || typeof ruta !== "string") return null;

  const rutaLimpia = ruta.trim();
  if (
    !rutaLimpia ||
    rutaLimpia.toLowerCase() === "sin icono" ||
    rutaLimpia.toLowerCase() === "sin_icon"
  ) {
    return null;
  }

  // Si ya es una URL absoluta o protocolo especial (http, https, blob, data),
  // se devuelve intacta.
  if (/^(https?:|blob:|data:)/i.test(rutaLimpia)) {
    return rutaLimpia;
  }

  const baseApi = (import.meta.env.VITE_API_URL || "").replace(/\/$/, "");
  const path = rutaLimpia.replace(/^\//, "");

  return baseApi ? `${baseApi}/${path}` : `/${path}`;
}

export const resolveIconUrl = urlDeMedia;
