import { useState } from "react";
import { useAuth } from "../context/AuthContext";
import { validarFormularioLogin } from "../utils/validaciones";

const VALORES_INICIALES = { email: "", password: "" };

// US 36 - BanNotFinishedException llega como HTTP 400 con un mensaje propio.
// Se detecta por el texto para no confundirlo con otros 400 de validación.
function esCuentaBaneada(result) {
  const mensaje = result?.error?.error;
  return (
    result?.status === 400 &&
    typeof mensaje === "string" &&
    /bane/i.test(mensaje)
  );
}

export function useIniciarSesion() {
  const { login } = useAuth();
  const [valores, setValores] = useState(VALORES_INICIALES);
  const [errores, setErrores] = useState({});
  const [cargando, setCargando] = useState(false);
  const [errorServidor, setErrorServidor] = useState(null);

  function handleChange(campo, valor) {
    setValores((prev) => ({ ...prev, [campo]: valor }));
  }

  async function handleSubmit(e) {
    e.preventDefault();
    setErrorServidor(null);

    const erroresValidacion = validarFormularioLogin(valores);
    setErrores(erroresValidacion);
    if (Object.keys(erroresValidacion).length > 0) return false;

    setCargando(true);
    const result = await login(valores.email, valores.password);
    setCargando(false);

    if (!result.success) {
      // El backend distingue los dos casos con status codes distintos:
      // 404 = EmailNotFoundException, 401 = WrongPasswordException.
      if (result.status === 404) {
        setErrorServidor("No existe una cuenta registrada con ese email.");
      } else if (result.status === 401) {
        setErrorServidor("La contraseña es incorrecta.");
      } else if (esCuentaBaneada(result)) {
        // US 36 - El backend responde 400 con
        // { error: "El baneo del jugador aún no ha finalizado" } cuando la
        // cuenta sigue suspendida. Se muestra ese mensaje tal cual para que
        // el jugador entienda por qué no puede entrar.
        setErrorServidor(
          result.error?.error ??
            "Tu cuenta está suspendida y no puede iniciar sesión."
        );
      } else {
        setErrorServidor("No pudimos iniciar sesión. Probá de nuevo.");
      }
      return null;
    }

    // Devuelve el usuario (no un booleano) para que la page pueda decidir a
    // donde navegar segun el rol.
    return result.user;
  }

  return {
    valores,
    errores,
    cargando,
    errorServidor,
    handleChange,
    handleSubmit,
  };
}
