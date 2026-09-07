const BASE_API = import.meta.env.VITE_API_URL ?? "";

// El backend devuelve las imagenes como ruta relativa ("/media/..."). Si la
// usaramos tal cual en un <img>, el navegador la resolveria contra el server
// de Vite (:5173) en vez de contra la API (:8000) y daria 404.
//
// Devuelve null cuando no hay ruta, para que quien la use pueda decidir su
// propio fallback.
export function urlDeMedia(ruta) {
  if (!ruta) return null;

  // Si el backend algun dia devuelve la URL completa, la dejamos como esta.
  if (/^https?:\/\//i.test(ruta)) return ruta;

  return `${BASE_API.replace(/\/$/, "")}/${ruta.replace(/^\//, "")}`;
}
