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
      // El backend distingue los dos casos con status codes distintos:
      // 404 = EmailNotFoundException, 401 = WrongPasswordException.
      if (result.status === 404) {
        setErrorServidor("No existe una cuenta registrada con ese email.");
      } else if (result.status === 401) {
        setErrorServidor("La contraseña es incorrecta.");
      } else {
        setErrorServidor("No pudimos iniciar sesión. Probá de nuevo.");
      }
      return false;
    }

    return true;
  }

  return { valores, errores, cargando, errorServidor, handleChange, handleSubmit };
}
