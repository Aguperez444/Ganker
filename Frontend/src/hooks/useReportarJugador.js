import { useEffect, useRef, useState } from "react";
import { reportarJugador } from "../api/moderacionApi";
import { logError } from "../utils/logs";
import {
  mensajeDeErrorReporte,
  validarFormularioReporte,
  validarImagenEvidencia,
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
  // Evidencia opcional: imagen (File) y/o link de YouTube.
  const [imagen, setImagen] = useState(null);
  const [vistaPreviaImagen, setVistaPreviaImagen] = useState(null);
  const [linkVideo, setLinkVideo] = useState("");

  const vistaPreviaRef = useRef(null);

  // Libera la URL de vista previa al cerrar el modal.
  useEffect(
    () => () => {
      if (vistaPreviaRef.current) URL.revokeObjectURL(vistaPreviaRef.current);
    },
    []
  );

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

  // Valida la imagen al elegirla para avisar enseguida si no sirve.
  function seleccionarImagen(archivo) {
    setErrorEnvio("");
    const error = validarImagenEvidencia(archivo);
    setErrores((actuales) => ({ ...actuales, imagen: error }));

    if (vistaPreviaRef.current) URL.revokeObjectURL(vistaPreviaRef.current);
    const valida = error ? null : (archivo ?? null);
    vistaPreviaRef.current = valida ? URL.createObjectURL(valida) : null;

    setImagen(valida);
    setVistaPreviaImagen(vistaPreviaRef.current);
  }

  function cambiarLinkVideo(valor) {
    setLinkVideo(valor);
    setErrorEnvio("");
    setErrores((actuales) => ({ ...actuales, linkVideo: undefined }));
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
      imagen,
      linkVideo,
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
        imagen,
        linkVideo,
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
    imagen,
    vistaPreviaImagen,
    linkVideo,
    seleccionarMotivo,
    cambiarDescripcion,
    seleccionarImagen,
    cambiarLinkVideo,
    continuar,
    volverAlFormulario,
    confirmarEnvio,
  };
}
