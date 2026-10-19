/**
 * El backend expone los websockets bajo el mismo host que VITE_API_URL, pero
 * con esquema ws/wss en vez de http/https. No hay una VITE_WS_URL propia:
 * se deriva de la misma variable que ya usa axiosClient, asi los devs no
 * tienen que mantener dos URLs sincronizadas a mano.
 */
export function urlWebSocket(ruta) {
  const baseApi = (import.meta.env.VITE_API_URL || "").replace(/\/$/, "");
  const rutaLimpia = ruta.startsWith("/") ? ruta : `/${ruta}`;

  if (baseApi) {
    const baseWs = baseApi.replace(/^http/i, "ws");
    return `${baseWs}${rutaLimpia}`;
  }

  if (typeof window !== "undefined" && window.location?.host) {
    const protocol = window.location.protocol === "https:" ? "wss:" : "ws:";
    return `${protocol}//${window.location.host}${rutaLimpia}`;
  }

  return rutaLimpia;
}
