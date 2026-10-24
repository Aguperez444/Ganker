import { useEffect, useState } from "react";
import { reenviarConfirmacionRegistro } from "../api/confirmacionRegistroApi";
import { logError } from "../utils/logs";
import { validarFormularioReenviarConfirmacion } from "../utils/validaciones";

// Espera antes de poder pedir otro mail. El backend limita los reenvios por IP
// y por mail (responde 429); esto evita llegar a ese limite sin querer.
export const SEGUNDOS_ENTRE_REENVIOS = 60;

// Confirmación de registro: pedir otro mail cuando no llego o el link vencio.
export function useReenviarConfirmacionRegistro(emailInicial = "") {
  const [email, setEmail] = useState(emailInicial);
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

  async function handleSubmit(e) {
    e.preventDefault();
    if (cargando || segundosParaReenviar > 0) return;
    setErrorServidor(null);
    setEnviado(null);
    const erroresValidacion = validarFormularioReenviarConfirmacion({ email });
    setErrores(erroresValidacion);
    if (Object.keys(erroresValidacion).length > 0) return;

    setCargando(true);
    try {
      const respuesta = await reenviarConfirmacionRegistro(email);
      setEnviado(respuesta.message);
      setSegundosParaReenviar(SEGUNDOS_ENTRE_REENVIOS);
    } catch (error) {
      logError("Error al reenviar la confirmación de registro:", error);
      if (error.response?.status === 422) {
        setErrores({ email: "El email no tiene un formato válido." });
      } else {
        // Incluye el 429 del limite de reenvios, que trae su propio mensaje.
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
    segundosParaReenviar,
    handleSubmit,
  };
}
