import { useCallback, useEffect, useState } from "react";
import {
  createGame as createGameRequest,
  deleteGame as deleteGameRequest,
  getGames,
  updateGame as updateGameRequest,
} from "../api/gameApi";
import { logError } from "../utils/logs";

// Errores de eliminar (US 23): sin permisos de owner, inexistente o ya
// eliminado, o caida del servidor.
function mapearErrorEliminacion(error) {
  const data = error.response?.data;
  const status = error.response?.status;

  if (!error.response) {
    return "No pudimos conectar con el servidor. Intentá de nuevo.";
  }
  if (status === 403) {
    return "No tenés permisos de owner para eliminar videojuegos.";
  }
  if (status === 404) return "El videojuego no existe o ya fue eliminado.";
  if (typeof data?.error === "string") return data.error;
  if (typeof data?.detail === "string") return data.detail;
  return "Ocurrió un error al eliminar el videojuego.";
}

// Modulo aparte (no un useCallback del componente) a proposito: llamar desde
// el cuerpo de un efecto a una funcion memoizada del propio componente que
// hace setState dispara la regla set-state-in-effect, y antes eso llevaba a
// duplicar entero este cuerpo entre loadGames y el efecto de montaje. Una
// funcion de modulo que solo recibe los setters no cuenta como "del
// componente" para esa regla, asi que ambos pueden llamar a la misma.
async function cargarVideojuegos({ setGames, setIsLoading, setError }) {
  try {
    setIsLoading(true);
    setError("");

    const videogames = await getGames();

    setGames(
      (videogames || []).map((game) => ({
        id: game.id ?? game.videogame_id,
        name: game.name,
        icon_url: game.icon_url,
        rank_per_role: Boolean(game.rank_per_role),
        has_characters: game.has_characters !== false,
      }))
    );
  } catch (error) {
    logError("Error al cargar videojuegos:", error);
    setError("No se pudieron cargar los videojuegos.");
  } finally {
    setIsLoading(false);
  }
}

const useGames = () => {
  const [games, setGames] = useState([]);

  const [isLoading, setIsLoading] = useState(true);
  const [isSaving, setIsSaving] = useState(false);

  const [error, setError] = useState("");
  const [actionError, setActionError] = useState("");

  const loadGames = useCallback(
    () => cargarVideojuegos({ setGames, setIsLoading, setError }),
    []
  );

  useEffect(() => {
    loadGames();
  }, [loadGames]);

  const registerGame = async (nameOrData, icon) => {
    try {
      setIsSaving(true);
      setActionError("");

      let name = nameOrData;
      let iconFile = icon;
      let rankPerRole = false;
      let hasCharacters = true;

      if (typeof nameOrData === "object" && nameOrData !== null) {
        name = nameOrData.name;
        iconFile = nameOrData.icon;
        rankPerRole = Boolean(nameOrData.rank_per_role);
        hasCharacters = nameOrData.has_characters !== false;
      }

      const newGame = await createGameRequest(
        name,
        iconFile,
        rankPerRole,
        hasCharacters
      );

      setGames((currentGames) => [
        ...currentGames,
        {
          id: newGame.id ?? newGame.videogame_id,
          name: newGame.name,
          icon_url: newGame.icon_url,
          rank_per_role: Boolean(newGame.rank_per_role),
          has_characters: newGame.has_characters !== false,
        },
      ]);

      return true;
    } catch (error) {
      if (error.response?.data?.error) {
        setActionError(error.response.data.error);
      } else if (error.response?.data?.detail) {
        setActionError(
          typeof error.response.data.detail === "string"
            ? error.response.data.detail
            : "Error de validación al registrar el videojuego."
        );
      } else if (error.response?.status === 400) {
        setActionError("Los datos ingresados no son válidos.");
      } else if (error.response?.status === 409) {
        setActionError("Ya existe un videojuego registrado con ese nombre.");
      } else {
        setActionError("Ocurrió un error al registrar el videojuego.");
      }

      return false;
    } finally {
      setIsSaving(false);
    }
  };

  const editGame = async (id, nameOrData, icon) => {
    try {
      setIsSaving(true);
      setActionError("");

      let name = nameOrData;
      let iconFile = icon;
      let rankPerRole = false;
      let hasCharacters = true;

      if (typeof nameOrData === "object" && nameOrData !== null) {
        name = nameOrData.name;
        iconFile = nameOrData.icon;
        rankPerRole = Boolean(nameOrData.rank_per_role);
        hasCharacters = nameOrData.has_characters !== false;
      }

      const updatedGame = await updateGameRequest(
        id,
        name,
        iconFile,
        rankPerRole,
        hasCharacters
      );

      setGames((currentGames) =>
        currentGames.map((game) =>
          game.id === id
            ? {
                id: updatedGame.id ?? updatedGame.videogame_id,
                name: updatedGame.name,
                icon_url: updatedGame.icon_url,
                rank_per_role: Boolean(updatedGame.rank_per_role),
                has_characters: updatedGame.has_characters !== false,
              }
            : game
        )
      );

      return true;
    } catch (error) {
      if (error.response?.data?.error) {
        setActionError(error.response.data.error);
      } else if (error.response?.data?.detail) {
        setActionError(
          typeof error.response.data.detail === "string"
            ? error.response.data.detail
            : "Error de validación al modificar el videojuego."
        );
      } else if (error.response?.status === 400) {
        setActionError("Los datos ingresados no son válidos.");
      } else if (error.response?.status === 409) {
        setActionError("Ya existe otro videojuego registrado con ese nombre.");
      } else if (error.response?.status === 404) {
        setActionError("El videojuego que intentás modificar ya no existe.");
      } else {
        setActionError("Ocurrió un error al modificar el videojuego.");
      }

      return false;
    } finally {
      setIsSaving(false);
    }
  };

  // Devuelve el mensaje de exito del backend, o null si fallo (el error queda
  // en actionError para mostrarlo en el modal de confirmacion).
  const removeGame = async (id) => {
    try {
      setIsSaving(true);
      setActionError("");

      const resultado = await deleteGameRequest(id);

      setGames((currentGames) => currentGames.filter((game) => game.id !== id));

      return (
        resultado?.message ?? "El videojuego ha sido eliminado exitosamente."
      );
    } catch (error) {
      logError("Error al eliminar el videojuego:", error);
      setActionError(mapearErrorEliminacion(error));

      // Inexistente o ya eliminado: se refresca la lista.
      if (error.response?.status === 404) {
        await loadGames();
      }

      return null;
    } finally {
      setIsSaving(false);
    }
  };

  const clearActionError = () => {
    setActionError("");
  };

  return {
    games,
    isLoading,
    isSaving,
    error,
    actionError,
    loadGames,
    registerGame,
    editGame,
    removeGame,
    clearActionError,
  };
};

export default useGames;
