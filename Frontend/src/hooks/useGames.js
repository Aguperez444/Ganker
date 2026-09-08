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

      setGames(
        (videogames || []).map((game) => ({
          id: game.id ?? game.videogame_id,
          name: game.name,
          icon_url: game.icon_url,
          rank_per_role: Boolean(game.rank_per_role),
        }))
      );
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

  const registerGame = async (nameOrData, icon) => {
    try {
      setIsSaving(true);
      setActionError("");

      let name = nameOrData;
      let iconFile = icon;
      let rankPerRole = false;

      if (typeof nameOrData === "object" && nameOrData !== null) {
        name = nameOrData.name;
        iconFile = nameOrData.icon;
        rankPerRole = Boolean(nameOrData.rank_per_role);
      }

      const newGame = await createGameRequest(name, iconFile, rankPerRole);

      setGames((currentGames) => [
        ...currentGames,
        {
          id: newGame.id ?? newGame.videogame_id,
          name: newGame.name,
          icon_url: newGame.icon_url,
          rank_per_role: Boolean(newGame.rank_per_role),
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

      if (typeof nameOrData === "object" && nameOrData !== null) {
        name = nameOrData.name;
        iconFile = nameOrData.icon;
        rankPerRole = Boolean(nameOrData.rank_per_role);
      }

      const updatedGame = await updateGameRequest(id, name, iconFile, rankPerRole);

      setGames((currentGames) =>
        currentGames.map((game) =>
          game.id === id
            ? {
                id: updatedGame.id ?? updatedGame.videogame_id,
                name: updatedGame.name,
                icon_url: updatedGame.icon_url,
                rank_per_role: Boolean(updatedGame.rank_per_role),
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
