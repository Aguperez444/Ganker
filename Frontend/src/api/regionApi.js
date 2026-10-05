import axiosClient from "./axiosClient";

export const getRegionsByGame = async (videogameId) => {
  if (!videogameId) return [];
  const response = await axiosClient.get(`/api/v1/regions/${videogameId}`);
  return response.data?.regions ?? [];
};
