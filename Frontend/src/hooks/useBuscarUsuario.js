import { useState } from "react";
import { buscarUsuarios, obtenerPerfilJugador } from "../api/jugadoresApi";
import { logError } from "../utils/logs";

// La busqueda del backend es parcial: se traen hasta el maximo que permite
// (100) y de ahi se toma el username exacto.
const MAX_RESULTADOS = 100;

// US 50 - Eliminar cuenta de usuario (admin).
// Admin > Usuarios identifica al usuario por su username (unico, aunque no
// sea la PK): se busca la coincidencia exacta y despues se trae su perfil
// publico (para mostrar sus perfiles de juego). El ID que devuelve es el que
// se usa para la baja.
export function useBuscarUsuario() {
  const [usernameBuscado, setUsernameBuscado] = useState("");
  const [encontrado, setEncontrado] = useState(null);
  const [buscando, setBuscando] = useState(false);
  const [error, setError] = useState("");

  // Devuelve true si encontro al usuario.
  async function buscar() {
    setError("");
    setEncontrado(null);

    // Se acepta que lo escriban como se muestra en la app (@usuario).
    const username = usernameBuscado.trim().replace(/^@/, "");
    if (!username) {
      setError("Ingresá un nombre de usuario.");
      return false;
    }

    try {
      setBuscando(true);
      const resultados = await buscarUsuarios(username, {
        size: MAX_RESULTADOS,
      });
      const exacto = resultados.find(
        (u) => u.username.toLowerCase() === username.toLowerCase()
      );
      if (!exacto) {
        setError("No existe un usuario activo con ese nombre de usuario.");
        return false;
      }

      setEncontrado(await obtenerPerfilJugador(exacto.user_id));
      return true;
    } catch (error) {
      logError("Error al buscar el usuario:", error);
      setError(
        error.response?.status === 404
          ? "No existe un usuario activo con ese nombre de usuario."
          : "No se pudo buscar el usuario."
      );
      return false;
    } finally {
      setBuscando(false);
    }
  }

  // Tras la baja: el usuario ya no esta activo, se vuelve al formulario vacio.
  function limpiar() {
    setUsernameBuscado("");
    setEncontrado(null);
    setError("");
  }

  return {
    usernameBuscado,
    encontrado,
    buscando,
    error,
    setUsernameBuscado,
    buscar,
    limpiar,
  };
}
