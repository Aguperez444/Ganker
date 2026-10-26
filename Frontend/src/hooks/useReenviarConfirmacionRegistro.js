import { useState } from "react";
import { reenviarConfirmacionRegistro } from "../api/confirmacionRegistroApi";
import { validarFormularioRecuperarContrasena } from "../utils/validaciones";

export function useReenviarConfirmacionRegistro(emailInicial = "") {
  const [email, setEmail] = useState(emailInicial);
  const [errores, setErrores] = useState({});
  const [cargando, setCargando] = useState(false);
  const [errorServidor, setErrorServidor] = useState(null);
  const [enviado, setEnviado] = useState(null);

  async function handleSubmit(e) {
    e.preventDefault();
    if (cargando) return;
    setErrorServidor(null);
    setEnviado(null);
    const erroresValidacion = validarFormularioRecuperarContrasena({ email });
    setErrores(erroresValidacion);
    if (Object.keys(erroresValidacion).length > 0) return;

    setCargando(true);
    try {
      const respuesta = await reenviarConfirmacionRegistro(email);
      setEnviado(respuesta.message);
    } catch (error) {
      if (error.response?.status === 422) {
        setErrores({ email: "El email no tiene un formato válido." });
      } else {
        const mensaje = error.response?.data?.error;
        setErrorServidor(
          typeof mensaje === "string"
            ? mensaje
            : "No pudimos reenviar el correo. Probá de nuevo."
        );
      }
    } finally {
      setCargando(false);
    }
  }

  return {
    email,
    setEmail,
    errores,
    cargando,
    errorServidor,
    enviado,
    handleSubmit,
  };
}
