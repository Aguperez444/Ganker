import axiosClient from "./axiosClient";

export const createGame = async (name) => {
  const response = await axiosClient.post("/games", {
    name,
  });

  return response.data;
};
