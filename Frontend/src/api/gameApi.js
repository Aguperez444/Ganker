import axiosClient from "./axiosClient";

export const getGames = async () => {
  const response = await axiosClient.get("/api/v1/videogames/");

  return response.data.videogames;
};

export const createGame = async (name) => {
  const response = await axiosClient.post("/api/v1/videogames/", {
    name,
  });

  return response.data;
};
