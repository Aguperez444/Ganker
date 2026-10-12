import axiosClient from "./axiosClient";

export const getGames = async () => {
  const response = await axiosClient.get("/api/v1/videogames/");

  return response.data.videogames;
};

export const createGame = async (
  nameOrData,
  iconFile,
  rankPerRole,
  hasCharacters
) => {
  let name = nameOrData;
  let icon = iconFile;
  let rank_per_role = rankPerRole ?? false;
  // Por defecto true, igual que el backend: solo juegos como CS2 lo apagan.
  let has_characters = hasCharacters ?? true;

  if (typeof nameOrData === "object" && !(nameOrData instanceof FormData)) {
    name = nameOrData.name;
    icon = nameOrData.icon;
    rank_per_role = Boolean(nameOrData.rank_per_role);
    has_characters = nameOrData.has_characters ?? true;
  }

  const payload =
    nameOrData instanceof FormData
      ? nameOrData
      : (() => {
          const fd = new FormData();
          if (name) fd.append("name", name);
          if (icon) fd.append("icon", icon);
          // El backend lo exige (Form obligatorio) desde que se agrego el
          // soporte de rank_per_role en videojuegos.
          fd.append("rank_per_role", rank_per_role);
          // Se manda siempre: si se omite al editar, el backend lo vuelve a
          // poner en true y el juego recupera los personajes.
          fd.append("has_characters", has_characters);
          return fd;
        })();

  const response = await axiosClient.post("/api/v1/videogames/", payload, {
    headers: {
      "Content-Type": "multipart/form-data",
    },
  });

  return response.data;
};

export const updateGame = async (
  id,
  nameOrData,
  iconFile,
  rankPerRole,
  hasCharacters
) => {
  let name = nameOrData;
  let icon = iconFile;
  let rank_per_role = rankPerRole ?? false;
  // Por defecto true, igual que el backend: solo juegos como CS2 lo apagan.
  let has_characters = hasCharacters ?? true;

  if (typeof nameOrData === "object" && !(nameOrData instanceof FormData)) {
    name = nameOrData.name;
    icon = nameOrData.icon;
    rank_per_role = Boolean(nameOrData.rank_per_role);
    has_characters = nameOrData.has_characters ?? true;
  }

  const payload =
    nameOrData instanceof FormData
      ? nameOrData
      : (() => {
          const fd = new FormData();
          if (name) fd.append("name", name);
          if (icon) fd.append("icon", icon);
          fd.append("rank_per_role", rank_per_role);
          // Se manda siempre: si se omite al editar, el backend lo vuelve a
          // poner en true y el juego recupera los personajes.
          fd.append("has_characters", has_characters);
          return fd;
        })();

  const response = await axiosClient.put(`/api/v1/videogames/${id}`, payload, {
    headers: {
      "Content-Type": "multipart/form-data",
    },
  });

  return response.data;
};
