import { useState } from "react";
import { confirmarRegistro } from "../api/confirmacionRegistroApi";
import { logError } from "../utils/logs";

// Confirmación de registro: crea la cuenta con el token del link del mail
// (/confirm-registration?token=...). No inicia sesion: despues se va al login.
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
      logError("Error al confirmar el registro:", error);
      const status = error.response?.status;
      const mensaje = error.response?.data?.error;

      if (status === 422) {
        // Token con formato invalido (el backend exige al menos 32 caracteres).
        setErrorServidor(
          "El enlace de confirmación es inválido. Solicitá uno nuevo."
        );
      } else if (typeof mensaje === "string") {
        // Enlace vencido o ya usado.
        setErrorServidor(mensaje);
      } else {
        setErrorServidor("No pudimos confirmar tu cuenta. Probá de nuevo.");
      }
    } finally {
      setCargando(false);
    }
  }

  return { cargando, errorServidor, exito, handleConfirmar };
}
