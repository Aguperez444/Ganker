import axiosClient from "./axiosClient";

export const getRanksByGame = async (videogameId) => {
  const response = await axiosClient.get(`/api/v1/ranks/${videogameId}`);

  return response.data.ranks;
};

export const createRank = async ({ videogame_id, name, value, icon }) => {
  const fd = new FormData();
  fd.append("videogame_id", videogame_id);
  fd.append("name", name);
  fd.append("value", value);
  fd.append("icon", icon);

  // Sin barra final: la ruta del backend es "/api/v1/ranks" (no "/api/v1/ranks/").
  // Nota: el endpoint todavía no devuelve un DTO limpio (responde la entidad de
  // dominio con atributos "_privados"), así que no confiamos en response.data acá;
  // quien llame debe refrescar la lista con getRanksByGame.
  await axiosClient.post("/api/v1/ranks", fd, {
    headers: {
      "Content-Type": "multipart/form-data",
    },
  });
};
