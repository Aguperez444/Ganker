import axiosClient from "./axiosClient";

export const getCharactersByGame = async (videogameId) => {
  const response = await axiosClient.get(`/api/v1/characters/${videogameId}`);

  return response.data.characters;
};

export const createCharacter = async ({ videogame_id, name, icon }) => {
  const fd = new FormData();
  fd.append("name", name);
  fd.append("videogame_id", videogame_id);
  fd.append("icon", icon);

  // Con barra final: a diferencia de ranks/roles, la ruta de creacion del
  // backend es "/api/v1/characters/" (con barra).
  const response = await axiosClient.post("/api/v1/characters/", fd, {
    headers: {
      "Content-Type": "multipart/form-data",
    },
  });

  return response.data;
};

export const updateCharacter = async (
  characterId,
  { videogame_id, name, icon }
) => {
  const fd = new FormData();
  fd.append("name", name);
  fd.append("videogame_id", videogame_id);
  // El icono es opcional al editar: si no se eligio uno nuevo, el backend
  // mantiene el actual (ver UpdateCharacter.execute).
  if (icon) {
    fd.append("icon", icon);
  }

  const response = await axiosClient.put(
    `/api/v1/characters/${characterId}`,
    fd,
    {
      headers: {
        "Content-Type": "multipart/form-data",
      },
    }
  );

  return response.data;
};
