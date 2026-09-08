import axiosClient from "./axiosClient";

export const getCharactersByGame = async (gameId) => {
  const response = await axiosClient.get(`/api/v1/characters/${gameId}`);

  return response.data.characters;
};

export const getRolesByGame = async (gameId) => {
  const response = await axiosClient.get(`/api/v1/roles/${gameId}`);

  return response.data.roles;
};

export const getRanksByGame = async (gameId) => {
  const response = await axiosClient.get(`/api/v1/ranks/${gameId}`);

  return response.data.ranks;
};

export const createGameProfile = async (profileData) => {
  const response = await axiosClient.post(
    "/api/v1/game_profiles/",
    profileData
  );

  return response.data;
};

// US 08 - Editar perfil de juego.
// El videojuego no viaja en el body: PUT /api/v1/game_profiles/{id} lo toma
// del perfil existente y no se puede cambiar (regla de negocio).
export const updateGameProfile = async (gameProfileId, profileData) => {
  const response = await axiosClient.put(
    `/api/v1/game_profiles/${gameProfileId}`,
    profileData
  );

  return response.data;
};
