// src/api/gameApi.js
import axiosClient from "./axiosClient";

export const createGame = async (name) => {
  const response = await axiosClient.post("/api/v1/videogames/", {
    name,
  });

  return response.data;
};
