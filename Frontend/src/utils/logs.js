// Loguear el error de axios entero (console.error("...", error)) imprime
// tambien su config, que incluye el header "Authorization: Bearer <token>":
// el token queda a la vista en la consola y se filtra facil en una captura o
// en un log compartido. Por eso se loguea solo lo que sirve para depurar.

export function resumirError(error) {
  if (error?.isAxiosError || error?.config || error?.response) {
    const data = error.response?.data;
    return {
      metodo: error.config?.method?.toUpperCase(),
      url: error.config?.url,
      status: error.response?.status ?? null,
      mensaje:
        (typeof data?.error === "string" && data.error) ||
        (typeof data?.detail === "string" && data.detail) ||
        error.message,
    };
  }

  // Errores comunes (no de axios): alcanza con el mensaje.
  if (error instanceof Error) return error.message;
  return error;
}

export function logError(contexto, error) {
  console.error(contexto, resumirError(error));
}
