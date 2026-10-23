import { useState } from "react";
import { solicitarCambioEmail } from "../api/cambioEmailApi";
import { validarFormularioCambioEmail } from "../utils/validaciones";

export function useCambiarEmail() {
  const [valores, setValores] = useState({ mail: "", password: "" });
  const [errores, setErrores] = useState({});
  const [cargando, setCargando] = useState(false);
  const [errorServidor, setErrorServidor] = useState(null);
  const [exito, setExito] = useState(null);

  function handleChange(campo, valor) {
    setValores((prev) => ({ ...prev, [campo]: valor }));
    setExito(null);
    setErrorServidor(null);
  }

  function handleBlur(campo) {
    const validacion = validarFormularioCambioEmail(valores);
    setErrores((prev) => ({ ...prev, [campo]: validacion[campo] }));
  }

  async function handleSubmit(e) {
    e.preventDefault();
    if (cargando) return;
    setErrorServidor(null);
    setExito(null);
    const validacion = validarFormularioCambioEmail(valores);
    setErrores(validacion);
    if (Object.keys(validacion).length) return;

    setCargando(true);
    try {
      const respuesta = await solicitarCambioEmail(valores);
      setExito(respuesta.message);
    } catch (error) {
      const mensaje = error.response?.data?.error;
      if (error.response?.status === 409) {
        setErrores({ mail: mensaje ?? "Ese email ya está en uso." });
      } else {
        setErrorServidor(
          typeof mensaje === "string"
            ? mensaje
            : "No pudimos solicitar el cambio de email. Probá de nuevo."
        );
      }
    } finally {
      setValores((prev) => ({ ...prev, password: "" }));
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
    handleBlur,
    handleSubmit,
  };
}
