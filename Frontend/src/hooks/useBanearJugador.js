import { useState } from "react";
import { banearJugador } from "../api/moderacionApi";
import { useAuth } from "../context/AuthContext";
import { obtenerIdUsuarioDesdeToken } from "../utils/jwt";
import { logError } from "../utils/logs";
import {
  DIAS_MINIMOS_BANEO,
  mensajeDeErrorBaneo,
  validarFormularioBaneo,
} from "../utils/baneos";

// US 36 - Banear jugador (admin).
//
// Mismo flujo de tres pasos que el reporte (US 35): formulario, confirmacion
// explicita y mensaje de exito. El jugador objetivo se selecciona antes
// (`jugador`) desde Admin > Moderacion o Admin > Usuarios; este hook solo se
// ocupa del formulario y del envio.
export default function useBanearJugador({ jugador, onClose }) {
  const { tokens } = useAuth();
  const miId = obtenerIdUsuarioDesdeToken(tokens?.access_token);

  const [motivo, setMotivo] = useState("");
  const [duracionDias, setDuracionDias] = useState(DIAS_MINIMOS_BANEO);
  const [errores, setErrores] = useState({});
  const [errorEnvio, setErrorEnvio] = useState("");
  const [baneando, setBaneando] = useState(false);
  const [paso, setPaso] = useState("formulario");
  const [resultado, setResultado] = useState(null);

  const esPropio = Boolean(
    jugador?.user_id && miId != null && jugador.user_id === miId
  );

  function cambiarMotivo(valor) {
    setMotivo(valor);
    setErrorEnvio("");
    setErrores((actuales) => ({ ...actuales, motivo: undefined }));
  }

  function cambiarDuracion(valor) {
    setDuracionDias(valor);
    setErrorEnvio("");
    setErrores((actuales) => ({ ...actuales, duracion: undefined }));
  }

  // Valida y pasa a la confirmacion. Devuelve false si no se puede continuar.
  function continuar() {
    setErrorEnvio("");

    const erroresValidacion = validarFormularioBaneo({
      jugador,
      motivo,
      duracionDias,
      miId,
    });
    setErrores(erroresValidacion);

    if (Object.keys(erroresValidacion).length > 0) return false;

    setPaso("confirmacion");
    return true;
  }

  function volverAlFormulario() {
    setErrorEnvio("");
    setPaso("formulario");
  }

  async function confirmarBaneo() {
    setErrorEnvio("");

    if (esPropio) {
      setErrorEnvio("No podés banear tu propia cuenta.");
      setPaso("formulario");
      return null;
    }

    try {
      setBaneando(true);

      await banearJugador({
        jugadorId: jugador.user_id,
        motivo,
        duracionDias,
      });

      const mensaje = `@${jugador.username} fue baneado correctamente.`;
      setResultado({ mensaje });
      setPaso("exito");

      return mensaje;
    } catch (error) {
      logError("Error al banear al jugador:", error);
      setErrorEnvio(mensajeDeErrorBaneo(error));
      return null;
    } finally {
      setBaneando(false);
    }
  }

  function cerrar() {
    onClose?.();
  }

  return {
    motivo,
    duracionDias,
    errores,
    errorEnvio,
    baneando,
    paso,
    resultado,
    esPropio,
    cambiarMotivo,
    cambiarDuracion,
    continuar,
    volverAlFormulario,
    confirmarBaneo,
    cerrar,
  };
}
