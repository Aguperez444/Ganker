import { useState } from "react";
import { confirmarCambioEmail } from "../api/cambioEmailApi";
import { useAuth } from "../context/AuthContext";

export function useConfirmarCambioEmail(token) {
  const { user, refrescarUsuario } = useAuth();
  const [cargando, setCargando] = useState(false);
  const [errorServidor, setErrorServidor] = useState(null);
  const [exito, setExito] = useState(null);

  async function handleConfirmar() {
    if (!token || cargando || exito) return;
    setCargando(true);
    setErrorServidor(null);
    try {
      const respuesta = await confirmarCambioEmail(token);
      setExito(respuesta.message);
      if (user) await refrescarUsuario().catch(() => {});
    } catch (error) {
      const mensaje = error.response?.data?.error;
      setErrorServidor(
        error.response?.status === 422
          ? "El enlace es inválido. Solicitá uno nuevo desde Mi cuenta."
          : typeof mensaje === "string"
            ? mensaje
            : "No pudimos confirmar el cambio de email. Probá de nuevo."
      );
    } finally {
      setCargando(false);
    }
  }

  return { cargando, errorServidor, exito, handleConfirmar };
}
