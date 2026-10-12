// Traduce el mensaje de error del backend ({ error } de las DomainException o
// { detail } de FastAPI/validación) con un fallback para los casos sin
// respuesta (red caída, etc.). Lo usan los hooks que llaman a la API de
// equipos (buscar, mi equipo).
export function mensajeDeError(error, fallback) {
  if (typeof error?.response?.data?.error === "string") {
    return error.response.data.error;
  }
  if (typeof error?.response?.data?.detail === "string") {
    return error.response.data.detail;
  }
  if (typeof error?.message === "string" && error.message) {
    return error.message;
  }
  return fallback;
}
