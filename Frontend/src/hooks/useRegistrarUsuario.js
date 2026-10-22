import { useState } from "react";
import { registrarUsuario } from "../api/jugadoresApi";
import { useAuth } from "../context/AuthContext";
import { logError } from "../utils/logs";
import { rolesQuePuedeRegistrar } from "../utils/rutas";
import { validarFormularioRegistroUsuario } from "../utils/validaciones";

const VALORES_INICIALES = {
  nombre: "",
  username: "",
  mail: "",
  password: "",
  confirmarPassword: "",
  rol: "player",
};

function mensajeDeError(error) {
  const status = error.response?.status;
  const data = error.response?.data;

  if (!error.response) {
    return "No pudimos conectar con el servidor. Intentá de nuevo.";
  }
  // 401: sesion invalida, o un admin intentando registrar a un owner.
  // 403: sin permisos de admin. En ambos casos el backend manda el motivo.
  if (typeof data?.error === "string") return data.error;
  if (typeof data?.detail === "string") return data.detail;
  if (status === 403) return "No tenés permisos para registrar usuarios.";
  if (status === 422) return "Hay datos del usuario que no son válidos.";
  return "No se pudo registrar al usuario. Probá de nuevo.";
}

// US 39 - Registrar usuario (admin u owner).
// Mismo manejo de campos que useRegistrarJugador, mas el rol. Los roles que se
// ofrecen salen del rol del admin logueado (ver rolesQuePuedeRegistrar).
export function useRegistrarUsuario() {
  const { user } = useAuth();
  const rolesPermitidos = rolesQuePuedeRegistrar(user);

  const [valores, setValores] = useState(VALORES_INICIALES);
  const [errores, setErrores] = useState({});
  const [tocados, setTocados] = useState({});
  const [cargando, setCargando] = useState(false);
  const [errorServidor, setErrorServidor] = useState(null);

  function revalidarCampo(campo, valoresActuales = valores) {
    const erroresActuales = validarFormularioRegistroUsuario(
      valoresActuales,
      rolesPermitidos
    );
    setErrores((prev) => ({ ...prev, [campo]: erroresActuales[campo] }));
  }

  function handleChange(campo, valor) {
    const nuevosValores = { ...valores, [campo]: valor };
    setValores(nuevosValores);

    if (campo === "password" && tocados.confirmarPassword) {
      revalidarCampo("confirmarPassword", nuevosValores);
    }
  }

  function handleBlur(campo) {
    setTocados((prev) => ({ ...prev, [campo]: true }));
    revalidarCampo(campo);
  }

  function limpiar() {
    setValores(VALORES_INICIALES);
    setErrores({});
    setTocados({});
    setErrorServidor(null);
  }

  // Devuelve el usuario registrado, o null si no se pudo registrar.
  async function registrar() {
    setErrorServidor(null);

    const erroresValidacion = validarFormularioRegistroUsuario(
      valores,
      rolesPermitidos
    );
    setErrores(erroresValidacion);
    if (Object.keys(erroresValidacion).length > 0) return null;

    setCargando(true);
    try {
      const registrado = await registrarUsuario(valores);
      limpiar();
      return registrado;
    } catch (error) {
      logError("Error al registrar el usuario:", error);
      const mensaje = error.response?.data?.error;

      if (error.response?.status === 409 && typeof mensaje === "string") {
        if (mensaje.toLowerCase().includes("email")) {
          setErrores((prev) => ({ ...prev, mail: mensaje }));
          return null;
        }
        if (mensaje.toLowerCase().includes("username")) {
          setErrores((prev) => ({ ...prev, username: mensaje }));
          return null;
        }
      }
      setErrorServidor(mensajeDeError(error));
      return null;
    } finally {
      setCargando(false);
    }
  }

  return {
    valores,
    errores,
    cargando,
    errorServidor,
    rolesPermitidos,
    handleChange,
    handleBlur,
    registrar,
  };
}
