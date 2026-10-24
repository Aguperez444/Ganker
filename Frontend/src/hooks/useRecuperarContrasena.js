import { useEffect, useState } from "react";
import { solicitarRecuperacion } from "../api/recuperacionContrasenaApi";
import { logError } from "../utils/logs";
import { validarFormularioRecuperarContrasena } from "../utils/validaciones";

// Mismo texto que responde el backend: no dice si el mail esta registrado.
export const MENSAJE_RECUPERACION_ENVIADA =
  "Si el correo coincide con una cuenta activa, recibirás un enlace de recuperación.";

// Espera antes de poder pedir otro mail. El backend ademas limita los pedidos
// por IP y por mail (responde 429); esto evita llegar a ese limite sin querer.
export const SEGUNDOS_ENTRE_ENVIOS = 60;

// US 34 - Cambiar contraseña, paso 1: pedir el mail de recuperacion.
export function useRecuperarContrasena(emailInicial = "") {
  const [valores, setValores] = useState({ email: emailInicial });
  const [errores, setErrores] = useState({});
  const [cargando, setCargando] = useState(false);
  const [errorServidor, setErrorServidor] = useState(null);
  const [enviado, setEnviado] = useState(null);
  const [segundosParaReenviar, setSegundosParaReenviar] = useState(0);

  useEffect(() => {
    if (segundosParaReenviar <= 0) return undefined;
    const timer = setTimeout(() => setSegundosParaReenviar((s) => s - 1), 1000);
    return () => clearTimeout(timer);
  }, [segundosParaReenviar]);

  function handleChange(campo, valor) {
    setValores((prev) => ({ ...prev, [campo]: valor }));
  }

  async function handleSubmit(e) {
    e.preventDefault();
    if (segundosParaReenviar > 0) return false;
    setErrorServidor(null);
    setEnviado(null);

    const erroresValidacion = validarFormularioRecuperarContrasena(valores);
    setErrores(erroresValidacion);
    if (Object.keys(erroresValidacion).length > 0) return false;

    setCargando(true);
    try {
      const respuesta = await solicitarRecuperacion(valores.email);
      setEnviado(respuesta?.message ?? MENSAJE_RECUPERACION_ENVIADA);
      setSegundosParaReenviar(SEGUNDOS_ENTRE_ENVIOS);
      return true;
    } catch (error) {
      logError("Error al pedir la recuperación de contraseña:", error);
      const status = error.response?.status;
      const mensaje = error.response?.data?.error;

      if (status === 422) {
        // El backend valida el formato con EmailStr.
        setErrores({ email: "El email no tiene un formato válido." });
      } else if (status === 429) {
        // Se paso el limite de pedidos por IP y por mail: no es que el mail
        // no se pueda enviar, hay que esperar.
        setErrorServidor(
          typeof mensaje === "string"
            ? mensaje
            : "Hiciste demasiados pedidos. Esperá unos minutos y probá de nuevo."
        );
      } else {
        setErrorServidor(
          "No pudimos enviar el enlace de recuperación. Probá de nuevo."
        );
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
    enviado,
    segundosParaReenviar,
    handleChange,
    handleSubmit,
  };
}
