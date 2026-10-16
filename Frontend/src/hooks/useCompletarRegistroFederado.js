import { useState } from "react";
import { completarRegistroFederado } from "../api/federatedAuthApi";
import { CLAVE_REGISTRO_FEDERADO } from "../utils/proveedoresFederados";
import { validarFormularioRegistroFederado } from "../utils/validaciones";

// Los datos llegan por location.state desde el callback; si el usuario
// recargó la página ese state se pierde, así que caemos a sessionStorage.
function leerDatosFederados(locationState) {
  if (locationState?.datosFederados?.registration_token) {
    return locationState.datosFederados;
  }
  try {
    const guardado = sessionStorage.getItem(CLAVE_REGISTRO_FEDERADO);
    if (!guardado) return null;
    const parseado = JSON.parse(guardado);
    return parseado?.registration_token ? parseado : null;
  } catch {
    return null;
  }
}

// Paso 3 (solo la primera vez): el jugador confirma username, nombre y mail
// sugeridos por el proveedor. Devuelve los tokens para que la page inicie
// sesión, igual que useRegistrarJugador.
export function useCompletarRegistroFederado(locationState) {
  const [datosFederados] = useState(() => leerDatosFederados(locationState));
  const [valores, setValores] = useState(() => ({
    username: datosFederados?.suggested_username || "",
    nombre: datosFederados?.suggested_name || "",
    mail: datosFederados?.email || "",
  }));
  const [errores, setErrores] = useState({});
  const [cargando, setCargando] = useState(false);
  const [errorServidor, setErrorServidor] = useState(null);

  function handleChange(campo, valor) {
    setValores((prev) => ({ ...prev, [campo]: valor }));
    setErrores((prev) => ({ ...prev, [campo]: undefined }));
  }

  function handleBlur(campo) {
    const erroresActuales = validarFormularioRegistroFederado(valores);
    setErrores((prev) => ({ ...prev, [campo]: erroresActuales[campo] }));
  }

  function cancelar() {
    sessionStorage.removeItem(CLAVE_REGISTRO_FEDERADO);
  }

  async function handleSubmit(e) {
    e.preventDefault();
    setErrorServidor(null);

    const erroresValidacion = validarFormularioRegistroFederado(valores);
    setErrores(erroresValidacion);
    if (Object.keys(erroresValidacion).length > 0) return null;

    setCargando(true);
    try {
      const tokens = await completarRegistroFederado({
        registrationToken: datosFederados.registration_token,
        username: valores.username,
        nombre: valores.nombre,
        mail: valores.mail,
      });
      sessionStorage.removeItem(CLAVE_REGISTRO_FEDERADO);
      return tokens;
    } catch (error) {
      const mensaje = error.response?.data?.error;

      if (error.response?.status === 409) {
        const texto = mensaje?.toLowerCase() ?? "";
        if (texto.includes("username")) {
          setErrores((prev) => ({ ...prev, username: mensaje }));
        } else if (texto.includes("email") || texto.includes("correo")) {
          setErrores((prev) => ({ ...prev, mail: mensaje }));
        } else {
          setErrorServidor(
            mensaje ?? "Esos datos ya están en uso por otra cuenta."
          );
        }
      } else {
        setErrorServidor(
          mensaje ?? "No se pudo completar el registro. Probá de nuevo."
        );
      }
      return null;
    } finally {
      setCargando(false);
    }
  }

  return {
    datosFederados,
    valores,
    errores,
    cargando,
    errorServidor,
    handleChange,
    handleBlur,
    handleSubmit,
    cancelar,
  };
}
