import { useState } from "react";
import { registrarJugador } from "../api/jugadoresApi";
import { validarFormularioRegistro } from "../utils/validaciones";

const VALORES_INICIALES = {
  nombre: "",
  username: "",
  mail: "",
  password: "",
  confirmarPassword: "",
};

export function useRegistrarJugador() {
  const [valores, setValores] = useState(VALORES_INICIALES);
  const [errores, setErrores] = useState({});
  const [tocados, setTocados] = useState({});
  const [cargando, setCargando] = useState(false);
  const [errorServidor, setErrorServidor] = useState(null);

  // Recalcula TODO el formulario pero solo guarda el error del campo pedido,
  // sin pisar los errores de los demás campos ya validados.
  function revalidarCampo(campo, valoresActuales = valores) {
    const erroresActuales = validarFormularioRegistro(valoresActuales);
    setErrores((prev) => ({ ...prev, [campo]: erroresActuales[campo] }));
  }

  function handleChange(campo, valor) {
    // Armo el objeto actualizado a mano (en vez de leer "valores" después de
    // setValores) porque setState es asíncrono: si llamara a revalidarCampo
    // sin pasarle este objeto, todavía leería el password VIEJO.
    const nuevosValores = { ...valores, [campo]: valor };
    setValores(nuevosValores);

    // Si el usuario ya paso por "confirmar contraseña" alguna vez y ahora
    // está tocando "contraseña", hay que revalidar la confirmación con el
    // valor nuevo. Sin esto, cambiar la contraseña deja un error (o un
    // "válido") desactualizado en el otro campo.
    if (campo === "password" && tocados.confirmarPassword) {
      revalidarCampo("confirmarPassword", nuevosValores);
    }
  }

  function handleBlur(campo) {
    setTocados((prev) => ({ ...prev, [campo]: true }));
    revalidarCampo(campo);
  }

  async function handleSubmit(e) {
    e.preventDefault();
    setErrorServidor(null);

    const erroresValidacion = validarFormularioRegistro(valores);
    setErrores(erroresValidacion);
    if (Object.keys(erroresValidacion).length > 0) return null;

    setCargando(true);
    try {
      return await registrarJugador(valores);
    } catch (error) {
      const mensaje = error.response?.data?.error;

      if (error.response?.status === 409) {
        if (mensaje?.toLowerCase().includes("email")) {
          setErrores((prev) => ({ ...prev, mail: mensaje }));
        } else if (mensaje?.toLowerCase().includes("username")) {
          setErrores((prev) => ({ ...prev, username: mensaje }));
        } else {
          setErrorServidor(mensaje ?? "No se pudo completar el registro.");
        }
      } else {
        setErrorServidor(mensaje ?? "No se pudo completar el registro. Probá de nuevo.");
      }
      return null;
    } finally {
      setCargando(false);
    }
  }

  return { valores, errores, cargando, errorServidor, handleChange, handleBlur, handleSubmit };
}