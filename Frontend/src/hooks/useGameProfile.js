import { useEffect, useState } from "react";
import { getGames } from "../api/gameApi";
import {
  createGameProfile,
  getCharactersByGame,
  getRanksByGame,
  getRolesByGame,
  updateGameProfile,
} from "../api/gameProfileApi";
import { useAuth } from "../context/AuthContext";

const useGameProfile = () => {
  const { refrescarUsuario } = useAuth();

  const [games, setGames] = useState([]);
  const [characters, setCharacters] = useState([]);
  const [roles, setRoles] = useState([]);
  const [ranks, setRanks] = useState([]);

  const [selectedGameId, setSelectedGameId] = useState("");
  const [selectedCharacters, setSelectedCharacters] = useState([]);
  const [selectedRoles, setSelectedRoles] = useState([]);

  // US 08 - Editar perfil de juego.
  // null = se esta creando un perfil nuevo. Con id = se esta editando ese
  // perfil existente; el videojuego queda bloqueado (ver GameProfileForm).
  const [editingProfileId, setEditingProfileId] = useState(null);

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

  // US 08 - Editar perfil de juego.
  // Precarga el formulario con un perfil existente. Los personajes y roles
  // salen directo del perfil (ya tienen la forma que necesita el formulario:
  // characters trae {character_id, name, icon_url} y role_profiles se mapea
  // a {role_id, rank_id}), asi que no hace falta esperar a que carguen los
  // catalogos del juego para mostrarlos ya seleccionados. El catalogo se
  // sigue pidiendo en paralelo (dispara el useEffect de selectedGameId) para
  // poder agregar personajes nuevos o cambiar de rango.
  const startEditProfile = (profile) => {
    setEditingProfileId(profile.game_profile_id);
    setSelectedGameId(String(profile.videogame.id));

    setSelectedCharacters(profile.characters);
    setSelectedRoles(
      profile.role_profiles.map((roleProfile) => ({
        role_id: roleProfile.role.role_id,
        rank_id: roleProfile.rank.rank_id,
      }))
    );

    setGameDataError("");
    setFormError("");
    setSuccessMessage("");
  };

  const resetGameProfileForm = () => {
    setEditingProfileId(null);
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

  // Tras crear o editar, se vuelve a pedir /me para que la lista de perfiles
  // de ProfilePage (que sale de AuthContext, no de este hook) se entere del
  // cambio. Si esa llamada falla no deshacemos el guardado: el perfil ya
  // quedo persistido en el backend, solo no se refresco el cache local.
  const refrescarPerfilesDelUsuario = async () => {
    try {
      await refrescarUsuario();
    } catch (error) {
      console.error("Error al refrescar los perfiles del jugador:", error);
    }
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

      await refrescarPerfilesDelUsuario();

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

  // US 08 - Editar perfil de juego.
  // Mismas validaciones que crear (al menos un personaje, al menos un rol,
  // ningun rol sin rango), pero contra /game_profiles/{id}: el videojuego no
  // viaja en el body porque no se puede cambiar.
  const submitEditGameProfile = async () => {
    setFormError("");
    setSuccessMessage("");

    if (!editingProfileId) {
      setFormError("No hay ningún perfil seleccionado para editar.");
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
      character_ids: selectedCharacters.map(
        (character) => character.character_id
      ),

      roles_ranks: selectedRoles.map((role) => ({
        role_id: role.role_id,
        rank_id: Number(role.rank_id),
      })),
    };

    try {
      setIsSaving(true);

      await updateGameProfile(editingProfileId, profileData);

      await refrescarPerfilesDelUsuario();

      setSuccessMessage("Perfil de juego actualizado correctamente.");

      return true;
    } catch (error) {
      console.error("Error al editar perfil de juego:", error);

      const status = error.response?.status;

      if (status === 400) {
        setFormError(
          "No se pudo guardar el perfil. Verificá que los personajes, roles y rangos elegidos correspondan al videojuego."
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
        setFormError("Ocurrió un error al editar el perfil de juego.");
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
    editingProfileId,

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
    startEditProfile,
    submitEditGameProfile,
  };
};

export default useGameProfile;
