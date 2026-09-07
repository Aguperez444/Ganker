import { useEffect, useState } from "react";
import { getGames } from "../api/gameApi";
import {
  createGameProfile,
  getCharactersByGame,
  getRanksByGame,
  getRolesByGame,
} from "../api/gameProfileApi";

const useGameProfile = () => {
  const [games, setGames] = useState([]);
  const [characters, setCharacters] = useState([]);
  const [roles, setRoles] = useState([]);
  const [ranks, setRanks] = useState([]);

  const [selectedGameId, setSelectedGameId] = useState("");
  const [selectedCharacters, setSelectedCharacters] = useState([]);
  const [selectedRoles, setSelectedRoles] = useState([]);

  const [isLoadingGames, setIsLoadingGames] = useState(true);
  const [isLoadingGameData, setIsLoadingGameData] = useState(false);

  const [gamesError, setGamesError] = useState("");
  const [gameDataError, setGameDataError] = useState("");

  const [isSaving, setIsSaving] = useState(false);
  const [formError, setFormError] = useState("");
  const [successMessage, setSuccessMessage] = useState("");

  useEffect(() => {
    const loadGames = async () => {
      try {
        setIsLoadingGames(true);
        setGamesError("");

        const videogames = await getGames();

        setGames(videogames);
      } catch (error) {
        console.error("Error al cargar videojuegos:", error);
        setGamesError("No se pudieron cargar los videojuegos disponibles.");
      } finally {
        setIsLoadingGames(false);
      }
    };

    loadGames();
  }, []);

  useEffect(() => {
    const loadGameData = async () => {
      if (!selectedGameId) {
        setCharacters([]);
        setRoles([]);
        setRanks([]);
        return;
      }

      try {
        setIsLoadingGameData(true);
        setGameDataError("");

        const [gameCharacters, gameRoles, gameRanks] = await Promise.all([
          getCharactersByGame(selectedGameId),
          getRolesByGame(selectedGameId),
          getRanksByGame(selectedGameId),
        ]);

        setCharacters(gameCharacters);
        setRoles(gameRoles);
        setRanks(gameRanks);
      } catch (error) {
        console.error("Error al cargar los datos del videojuego:", error);

        setCharacters([]);
        setRoles([]);
        setRanks([]);

        setGameDataError(
          "No se pudieron cargar los personajes, roles y rangos del videojuego."
        );
      } finally {
        setIsLoadingGameData(false);
      }
    };

    loadGameData();
  }, [selectedGameId]);

  const selectGame = (gameId) => {
    setSelectedGameId(gameId);

    setCharacters([]);
    setRoles([]);
    setRanks([]);

    setSelectedCharacters([]);
    setSelectedRoles([]);

    setGameDataError("");

    setFormError("");
    setSuccessMessage("");
  };

  const addCharacter = (characterId) => {
    if (!characterId) return;

    const character = characters.find(
      (item) => item.character_id === Number(characterId)
    );

    if (!character) return;

    const alreadySelected = selectedCharacters.some(
      (item) => item.character_id === character.character_id
    );

    if (alreadySelected) return;

    setSelectedCharacters((currentCharacters) => [
      ...currentCharacters,
      character,
    ]);
  };

  const removeCharacter = (characterId) => {
    setSelectedCharacters((currentCharacters) =>
      currentCharacters.filter(
        (character) => character.character_id !== characterId
      )
    );
  };

  const moveCharacter = (characterId, direction) => {
    setSelectedCharacters((currentCharacters) => {
      const currentIndex = currentCharacters.findIndex(
        (character) => character.character_id === characterId
      );

      if (currentIndex === -1) return currentCharacters;

      const newIndex = direction === "up" ? currentIndex - 1 : currentIndex + 1;

      if (newIndex < 0 || newIndex >= currentCharacters.length) {
        return currentCharacters;
      }

      const reorderedCharacters = [...currentCharacters];

      [reorderedCharacters[currentIndex], reorderedCharacters[newIndex]] = [
        reorderedCharacters[newIndex],
        reorderedCharacters[currentIndex],
      ];

      return reorderedCharacters;
    });
  };

  const toggleRole = (roleId) => {
    const numericRoleId = Number(roleId);

    setSelectedRoles((currentRoles) => {
      const alreadySelected = currentRoles.some(
        (role) => role.role_id === numericRoleId
      );

      if (alreadySelected) {
        return currentRoles.filter((role) => role.role_id !== numericRoleId);
      }

      return [
        ...currentRoles,
        {
          role_id: numericRoleId,
          rank_id: "",
        },
      ];
    });
  };

  const selectRoleRank = (roleId, rankId) => {
    setSelectedRoles((currentRoles) =>
      currentRoles.map((role) =>
        role.role_id === Number(roleId)
          ? {
              ...role,
              rank_id: rankId ? Number(rankId) : "",
            }
          : role
      )
    );
  };

  const resetGameProfileForm = () => {
    setSelectedGameId("");

    setCharacters([]);
    setRoles([]);
    setRanks([]);

    setSelectedCharacters([]);
    setSelectedRoles([]);

    setGameDataError("");
    setFormError("");
    setSuccessMessage("");
  };

  const submitGameProfile = async () => {
    setFormError("");
    setSuccessMessage("");

    if (!selectedGameId) {
      setFormError("Debes seleccionar un videojuego.");
      return false;
    }

    if (selectedCharacters.length === 0) {
      setFormError("Debes seleccionar al menos un personaje.");
      return false;
    }

    if (selectedRoles.length === 0) {
      setFormError("Debes seleccionar al menos un rol.");
      return false;
    }

    const hasRoleWithoutRank = selectedRoles.some((role) => !role.rank_id);

    if (hasRoleWithoutRank) {
      setFormError("Debes seleccionar un rango para cada rol elegido.");
      return false;
    }

    const profileData = {
      videogame_id: Number(selectedGameId),

      character_ids: selectedCharacters.map(
        (character) => character.character_id
      ),

      roles: selectedRoles.map((role) => ({
        role_id: role.role_id,
        rank_id: Number(role.rank_id),
      })),
    };

    try {
      setIsSaving(true);

      const createdProfile = await createGameProfile(profileData);

      setSuccessMessage(
        `Perfil de juego creado correctamente. ID: ${createdProfile.profile_id}`
      );

      return true;
    } catch (error) {
      console.error("Error al crear perfil de juego:", error);

      const status = error.response?.status;

      if (status === 400) {
        setFormError(
          "No se pudo crear el perfil. Verifica los datos o si ya tienes un perfil para este videojuego."
        );
      } else if (status === 401) {
        setFormError("Tu sesión no es válida o ha expirado.");
      } else if (status === 403) {
        setFormError("No tienes permisos para realizar esta acción.");
      } else if (status === 404) {
        setFormError(
          "Alguno de los datos seleccionados ya no se encuentra disponible."
        );
      } else if (status === 422) {
        setFormError("Los datos ingresados no son válidos.");
      } else {
        setFormError("Ocurrió un error al crear el perfil de juego.");
      }

      return false;
    } finally {
      setIsSaving(false);
    }
  };

  return {
    games,
    characters,
    roles,
    ranks,

    selectedGameId,
    selectedCharacters,
    selectedRoles,

    isLoadingGames,
    isLoadingGameData,
    isSaving,

    gamesError,
    gameDataError,
    formError,
    successMessage,

    selectGame,
    addCharacter,
    removeCharacter,
    moveCharacter,
    toggleRole,
    selectRoleRank,
    submitGameProfile,
    resetGameProfileForm,
  };
};

export default useGameProfile;
