import axiosClient from "./axiosClient";

export const getRegionsByGame = async (videogameId) => {
  const response = await axiosClient.get(`/api/v1/regions/${videogameId}`);

  return response.data.regions;
};

export const createRegion = async ({ videogame_id, name }) => {
  const formData = new FormData();

  formData.append("videogame_id", videogame_id);
  formData.append("name", name);

  const response = await axiosClient.post("/api/v1/regions", formData, {
    headers: {
      "Content-Type": "multipart/form-data",
    },
  });

  return response.data;
};

export const updateRegion = async (regionId, name) => {
  const response = await axiosClient.put(`/api/v1/regions/${regionId}`, null, {
    params: {
      name,
    },
  });

  return response.data;
};

export const deleteRegion = async (regionId) => {
  const response = await axiosClient.delete(`/api/v1/regions/${regionId}`);

  return response.data;
};
