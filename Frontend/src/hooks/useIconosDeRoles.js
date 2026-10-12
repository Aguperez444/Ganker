import { useEffect, useState } from "react";
import { getRolesByGame } from "../api/roleApi";
import { logError } from "../utils/logs";

// Los integrantes de un equipo (TeamSummaryResponse.members) traen el id y
// el nombre de su rol, pero no su icono. Se cruza con el catalogo de roles
// del juego. El catalogo casi no cambia: se pide una vez por juego y se
// comparte entre pantallas.
const cachePorJuego = new Map();

function pedirRoles(videojuegoId) {
  if (!cachePorJuego.has(videojuegoId)) {
    const pedido = Promise.resolve()
      .then(() => getRolesByGame(videojuegoId))
      .catch((error) => {
        // Si falla no se cachea, para poder reintentar en la proxima pantalla.
        cachePorJuego.delete(videojuegoId);
        throw error;
      });
    cachePorJuego.set(videojuegoId, pedido);
  }
  return cachePorJuego.get(videojuegoId);
}

// Convierte una lista de roles del catalogo en { role_id: icon_url }.
export function iconosPorRol(roles) {
  return Object.fromEntries(
    (roles ?? []).map((rol) => [rol.role_id, rol.icon_url])
  );
}

// Devuelve { role_id: icon_url } para el videojuego (vacio mientras carga o
// si no se pudo obtener: las filas se muestran igual, sin el icono del rol).
const useIconosDeRoles = (videojuegoId) => {
  const [iconos, setIconos] = useState({});

  useEffect(() => {
    if (!videojuegoId) return undefined;
    let cancelado = false;

    pedirRoles(videojuegoId)
      .then((roles) => {
        if (!cancelado) setIconos(iconosPorRol(roles));
      })
      .catch((error) =>
        logError("Error al cargar los iconos de roles:", error)
      );

    return () => {
      cancelado = true;
    };
  }, [videojuegoId]);

  return iconos;
};

export default useIconosDeRoles;
