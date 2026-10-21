import { useState } from "react";
import { restablecerContrasena } from "../api/recuperacionContrasenaApi";
import { logError } from "../utils/logs";
import { validarFormularioNuevaContrasena } from "../utils/validaciones";

export const MENSAJE_LINK_INVALIDO =
  "El enlace de recuperación es inválido o ya fue utilizado.";

// US 34 - Cambiar contraseña, paso 2: elegir la nueva contraseña con el token
// del link del mail (/reset-password?token=...).
export function useRestablecerContrasena(token) {
  const [valores, setValores] = useState({
    password: "",
    confirmarPassword: "",
  });
  const [errores, setErrores] = useState({});
  const [cargando, setCargando] = useState(false);
  const [errorServidor, setErrorServidor] = useState(null);
  const [exito, setExito] = useState(null);

  function handleChange(campo, valor) {
    setValores((prev) => ({ ...prev, [campo]: valor }));
  }

  async function handleSubmit(e) {
    e.preventDefault();
    setErrorServidor(null);

    const erroresValidacion = validarFormularioNuevaContrasena(valores);
    setErrores(erroresValidacion);
    if (Object.keys(erroresValidacion).length > 0) return false;

    setCargando(true);
    try {
      const respuesta = await restablecerContrasena(token, valores.password);
      setExito(
        respuesta?.message ?? "La contraseña ha sido restablecida correctamente"
      );
      return true;
    } catch (error) {
      logError("Error al restablecer la contraseña:", error);
      const status = error.response?.status;
      const mensaje = error.response?.data?.error;

      if (status === 422) {
        // Token con formato invalido (el backend exige al menos 32 caracteres).
        setErrorServidor(MENSAJE_LINK_INVALIDO);
      } else if (typeof mensaje === "string") {
        // Enlace vencido, ya usado o contraseña no segura.
        setErrorServidor(mensaje);
      } else {
        setErrorServidor("No pudimos cambiar tu contraseña. Probá de nuevo.");
      }
      return false;
    } finally {
      setCargando(false);
    }
  }

  return {
    valores,
    errores,
    cargando,
    errorServidor,
    exito,
    handleChange,
    handleSubmit,
  };
}
