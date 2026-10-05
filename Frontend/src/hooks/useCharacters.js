import { useCallback, useState } from "react";
import {
  createCharacter,
  deleteCharacter,
  getCharactersByGame,
  updateCharacter,
} from "../api/characterApi";

function mapearErrorAccion(error, accion) {
  if (error.response?.data?.error) return error.response.data.error;

  if (error.response?.data?.detail) {
    return typeof error.response.data.detail === "string"
      ? error.response.data.detail
      : `Error de validación al ${accion} el personaje.`;
  }

  const status = error.response?.status;
  if (status === 400) return "Los datos ingresados no son válidos.";
  if (status === 404) {
    return accion === "eliminar"
      ? "El personaje no existe o ya fue eliminado."
      : "El videojuego seleccionado no existe.";
  }
  if (status === 409) {
    return "Ya existe un personaje con ese nombre para este videojuego.";
  }
  return `Ocurrió un error al ${accion} el personaje.`;
}

const useCharacters = () => {
  const [characters, setCharacters] = useState([]);

  const [isLoading, setIsLoading] = useState(false);
  const [isSaving, setIsSaving] = useState(false);

  const [error, setError] = useState("");
  const [actionError, setActionError] = useState("");

  const loadCharacters = useCallback(async (videogameId) => {
    if (!videogameId) {
      setCharacters([]);
      return;
    }

    try {
      setIsLoading(true);
      setError("");

      const gameCharacters = await getCharactersByGame(videogameId);

      setCharacters(
        (gameCharacters || []).map((character) => ({
          id: character.character_id,
          name: character.name,
          icon_url: character.icon_url,
        }))
      );
    } catch (error) {
      console.error("Error al cargar personajes:", error);
      setError("No se pudieron cargar los personajes.");
    } finally {
      setIsLoading(false);
    }
  }, []);

  const registerCharacter = async ({ videogame_id, name, icon }) => {
    try {
      setIsSaving(true);
      setActionError("");

      await createCharacter({ videogame_id, name, icon });

      // Refrescamos desde la fuente de verdad (GET) en vez de confiar en la
      // respuesta del POST, mismo criterio que useRanks/useRoles.
      await loadCharacters(videogame_id);

      return true;
    } catch (error) {
      setActionError(mapearErrorAccion(error, "registrar"));
      return false;
    } finally {
      setIsSaving(false);
    }
  };

  const removeCharacter = async (characterId, videogameId) => {
    try {
      setIsSaving(true);
      setActionError("");

      await deleteCharacter(characterId);
      await loadCharacters(videogameId);

      return true;
    } catch (error) {
      setActionError(mapearErrorAccion(error, "eliminar"));

      // Si el personaje ya no existe (otro admin lo borró), refrescamos la
      // lista para que deje de mostrarse.
      if (error.response?.status === 404) {
        await loadCharacters(videogameId);
      }

      return false;
    } finally {
      setIsSaving(false);
    }
  };

  const editCharacter = async (characterId, { videogame_id, name, icon }) => {
    try {
      setIsSaving(true);
      setActionError("");

      await updateCharacter(characterId, { videogame_id, name, icon });
      await loadCharacters(videogame_id);

      return true;
    } catch (error) {
      setActionError(mapearErrorAccion(error, "modificar"));
      return false;
    } finally {
      setIsSaving(false);
    }
  };

  const clearActionError = () => {
    setActionError("");
  };

  return {
    characters,
    isLoading,
    isSaving,
    error,
    actionError,
    loadCharacters,
    registerCharacter,
    editCharacter,
    removeCharacter,
    clearActionError,
  };
};

export default useCharacters;
