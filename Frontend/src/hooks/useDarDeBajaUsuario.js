import { useState } from "react";
import { eliminarUsuario } from "../api/jugadoresApi";
import { useAuth } from "../context/AuthContext";
import { obtenerIdUsuarioDesdeToken } from "../utils/jwt";
import { logError } from "../utils/logs";

export const MENSAJE_AUTOELIMINACION =
  "No podés darte de baja a vos mismo desde acá. Usá “Eliminar cuenta” en Mi cuenta.";

function mensajeDeError(error) {
  const status = error.response?.status;
  const data = error.response?.data;

  if (!error.response) {
    return "No pudimos conectar con el servidor. Intentá de nuevo.";
  }
  if (status === 404) return "El usuario no existe o ya fue dado de baja.";
  if (status === 401) return "Tu sesión no es válida o ha expirado.";
  // 403: sin permisos de admin, o un admin intentando dar de baja al owner.
  // El backend manda el motivo legible.
  if (typeof data?.error === "string") return data.error;
  if (typeof data?.detail === "string") return data.detail;
  if (status === 403) {
    return "No tenés permisos para dar de baja a este usuario.";
  }
  return "Ocurrió un error al dar de baja al usuario.";
}

// US 50 - Eliminar cuenta de usuario (admin).
// `usuario` es el que se esta por dar de baja ({ user_id, username, ... });
// mientras no es null, el modal de confirmacion esta abierto.
// La autoeliminacion se frena aca: el endpoint de admin no la rechaza, y la
// baja propia tiene su flujo en Mi cuenta (US 04), que ademas cierra la sesion.
export function useDarDeBajaUsuario() {
  const { tokens } = useAuth();
  const miId = obtenerIdUsuarioDesdeToken(tokens?.access_token);

  const [usuario, setUsuario] = useState(null);
  const [cargando, setCargando] = useState(false);
  const [error, setError] = useState("");

  const esUnoMismo = (otro) => miId !== null && otro?.user_id === miId;

  function abrir(otro) {
    setError(esUnoMismo(otro) ? MENSAJE_AUTOELIMINACION : "");
    setUsuario(otro);
  }

  function cancelar() {
    setError("");
    setUsuario(null);
  }

  // Devuelve el mensaje de exito, o null si no se dio de baja.
  async function confirmar() {
    if (!usuario) return null;

    if (esUnoMismo(usuario)) {
      setError(MENSAJE_AUTOELIMINACION);
      return null;
    }

    try {
      setCargando(true);
      setError("");

      await eliminarUsuario(usuario.user_id);

      const mensaje = `La cuenta de @${usuario.username} fue dada de baja correctamente.`;
      setUsuario(null);
      return mensaje;
    } catch (error) {
      logError("Error al dar de baja al usuario:", error);
      setError(mensajeDeError(error));
      return null;
    } finally {
      setCargando(false);
    }
  }

  return {
    usuario,
    cargando,
    error,
    esUnoMismo,
    abrir,
    cancelar,
    confirmar,
  };
}
