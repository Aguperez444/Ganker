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
