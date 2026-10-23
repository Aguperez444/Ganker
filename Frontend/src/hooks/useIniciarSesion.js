import { useState } from "react";
import { useAuth } from "../context/AuthContext";
import { validarFormularioLogin } from "../utils/validaciones";

const VALORES_INICIALES = { email: "", password: "" };

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
      // El backend distingue mail inexistente (404) de contraseña incorrecta
      // (401), pero mostrarlo por separado le confirma a cualquiera que mail
      // tiene cuenta. Se responde lo mismo en los dos casos.
      if (result.status === 404 || result.status === 401) {
        setErrorServidor("El email o la contraseña son incorrectos.");
      } else if (result.status === 429) {
        // Limite de intentos del backend: su mensaje dice que hay que esperar.
        setErrorServidor(
          result.error?.detail ??
            "Demasiados intentos. Esperá un minuto y probá de nuevo."
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
