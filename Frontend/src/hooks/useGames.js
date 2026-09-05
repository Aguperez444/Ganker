import { useCallback, useEffect, useState } from "react";
import {
  createGame as createGameRequest,
  getGames,
  updateGame as updateGameRequest,
} from "../api/gameApi";

const useGames = () => {
  const [games, setGames] = useState([]);

  const [isLoading, setIsLoading] = useState(true);
  const [isSaving, setIsSaving] = useState(false);

  const [error, setError] = useState("");
  const [actionError, setActionError] = useState("");

  const loadGames = useCallback(async () => {
    try {
      setIsLoading(true);
      setError("");

      const videogames = await getGames();

      setGames(videogames);
    } catch (error) {
      console.error("Error al cargar videojuegos:", error);
      setError("No se pudieron cargar los videojuegos.");
    } finally {
      setIsLoading(false);
    }
  }, []);

  useEffect(() => {
    loadGames();
  }, [loadGames]);

  const registerGame = async (name) => {
    try {
      setIsSaving(true);
      setActionError("");

      const newGame = await createGameRequest(name);

      setGames((currentGames) => [
        ...currentGames,
        {
          id: newGame.videogame_id,
          name: newGame.name,
        },
      ]);

      return true;
    } catch (error) {
      if (error.response?.status === 400) {
        setActionError("El nombre ingresado no es válido.");
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

  const editGame = async (id, name) => {
    try {
      setIsSaving(true);
      setActionError("");

      const updatedGame = await updateGameRequest(id, name);

      setGames((currentGames) =>
        currentGames.map((game) =>
          game.id === id
            ? {
                id: updatedGame.videogame_id,
                name: updatedGame.name,
              }
            : game
        )
      );

      return true;
    } catch (error) {
      if (error.response?.status === 400) {
        setActionError("El nombre ingresado no es válido.");
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
    clearActionError,
  };
};

export default useGames;
