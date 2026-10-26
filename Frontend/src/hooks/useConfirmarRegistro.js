import { useState } from "react";
import { confirmarRegistro } from "../api/confirmacionRegistroApi";

export function useConfirmarRegistro(token) {
  const [cargando, setCargando] = useState(false);
  const [errorServidor, setErrorServidor] = useState(null);
  const [exito, setExito] = useState(null);

  async function handleConfirmar() {
    if (!token || cargando || exito) return;
    setCargando(true);
    setErrorServidor(null);
    try {
      const respuesta = await confirmarRegistro(token);
      setExito(respuesta.message);
    } catch (error) {
      const mensaje = error.response?.data?.error;
      setErrorServidor(
        error.response?.status === 422
          ? "El enlace de confirmación es inválido. Solicitá uno nuevo."
          : typeof mensaje === "string"
            ? mensaje
            : "No pudimos confirmar tu cuenta. Probá de nuevo."
      );
    } finally {
      setCargando(false);
    }
  }

  return { cargando, errorServidor, exito, handleConfirmar };
}
