import { useState } from "react";
import { obtenerPerfilJugador } from "../api/jugadoresApi";
import { logError } from "../utils/logs";

// US 50 - Eliminar cuenta de usuario (admin).
// El backend no expone un listado de usuarios, asi que Admin > Usuarios
// identifica al usuario por su ID (el de la URL de su perfil,
// /app/jugadores/<id>) usando el mismo endpoint del perfil publico.
export function useBuscarUsuario() {
  const [idBuscado, setIdBuscado] = useState("");
  const [encontrado, setEncontrado] = useState(null);
  const [buscando, setBuscando] = useState(false);
  const [error, setError] = useState("");

  // Devuelve true si encontro al usuario.
  async function buscar() {
    setError("");
    setEncontrado(null);

    const id = Number(idBuscado);
    if (!Number.isInteger(id) || id <= 0) {
      setError("Ingresá un ID de usuario válido.");
      return false;
    }

    try {
      setBuscando(true);
      setEncontrado(await obtenerPerfilJugador(id));
      return true;
    } catch (error) {
      logError("Error al buscar el usuario:", error);
      setError(
        error.response?.status === 404
          ? "No existe un usuario activo con ese ID."
          : "No se pudo buscar el usuario."
      );
      return false;
    } finally {
      setBuscando(false);
    }
  }

  // Tras la baja: el usuario ya no esta activo, se vuelve al formulario vacio.
  function limpiar() {
    setIdBuscado("");
    setEncontrado(null);
    setError("");
  }

  return {
    idBuscado,
    encontrado,
    buscando,
    error,
    setIdBuscado,
    buscar,
    limpiar,
  };
}
