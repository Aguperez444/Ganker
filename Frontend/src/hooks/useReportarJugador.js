import { useState } from "react";
import { reportarJugador } from "../api/moderacionApi";
import { logError } from "../utils/logs";
import {
  mensajeDeErrorReporte,
  validarFormularioReporte,
} from "../utils/reportesJugadores";

export const PASO_FORMULARIO = "formulario";
export const PASO_CONFIRMACION = "confirmacion";
export const PASO_EXITO = "exito";

export default function useReportarJugador({ jugador, currentUserId }) {
  const [motivo, setMotivo] = useState("");
  const [descripcion, setDescripcion] = useState("");
  const [errores, setErrores] = useState({});
  const [errorEnvio, setErrorEnvio] = useState("");
  const [enviando, setEnviando] = useState(false);
  const [paso, setPaso] = useState(PASO_FORMULARIO);
  const [reporte, setReporte] = useState(null);

  const esPropio = Boolean(
    jugador?.user_id && currentUserId && jugador.user_id === currentUserId
  );

  function seleccionarMotivo(valor) {
    setMotivo(valor);
    setErrorEnvio("");
    setErrores((actuales) => ({ ...actuales, motivo: undefined }));
  }

  function cambiarDescripcion(valor) {
    setDescripcion(valor);
    setErrorEnvio("");
    setErrores((actuales) => ({ ...actuales, descripcion: undefined }));
  }

  // Valida y pasa al resumen. Devuelve false si no se puede continuar.
  function continuar() {
    setErrorEnvio("");

    if (esPropio) {
      setErrorEnvio("No podés reportarte a vos mismo.");
      return false;
    }

    const erroresValidacion = validarFormularioReporte({
      motivo,
      descripcion,
    });
    setErrores(erroresValidacion);

    if (Object.keys(erroresValidacion).length > 0) return false;

    setPaso(PASO_CONFIRMACION);
    return true;
  }

  function volverAlFormulario() {
    setErrorEnvio("");
    setPaso(PASO_FORMULARIO);
  }

  async function confirmarEnvio() {
    setErrorEnvio("");

    if (esPropio) {
      setErrorEnvio("No podés reportarte a vos mismo.");
      setPaso(PASO_FORMULARIO);
      return false;
    }

    // El limite de reportes seguidos al mismo jugador lo controla el backend
    // (429): el error se muestra en el paso de confirmacion.
    try {
      setEnviando(true);

      const creado = await reportarJugador({
        reportedId: jugador.user_id,
        motivo,
        descripcion,
      });

      setReporte(creado);
      setPaso(PASO_EXITO);

      return true;
    } catch (error) {
      logError("Error al reportar al jugador:", error);
      setErrorEnvio(mensajeDeErrorReporte(error));
      return false;
    } finally {
      setEnviando(false);
    }
  }

  return {
    motivo,
    descripcion,
    errores,
    errorEnvio,
    enviando,
    paso,
    reporte,
    esPropio,
    seleccionarMotivo,
    cambiarDescripcion,
    continuar,
    volverAlFormulario,
    confirmarEnvio,
  };
}
