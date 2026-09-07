import axiosClient from "./axiosClient";

export const getGames = async () => {
  const response = await axiosClient.get("/api/v1/videogames/");

  return response.data.videogames;
};

export const createGame = async (nameOrData, iconFile) => {
  let name = nameOrData;
  let icon = iconFile;

  if (typeof nameOrData === "object" && !(nameOrData instanceof FormData)) {
    name = nameOrData.name;
    icon = nameOrData.icon;
  }

  const payload =
    nameOrData instanceof FormData
      ? nameOrData
      : (() => {
          const fd = new FormData();
          if (name) fd.append("name", name);
          if (icon) fd.append("icon", icon);
          return fd;
        })();

  const response = await axiosClient.post("/api/v1/videogames/", payload, {
    headers: {
      "Content-Type": "multipart/form-data",
    },
  });

  return response.data;
};

export const updateGame = async (id, nameOrData, iconFile) => {
  let name = nameOrData;
  let icon = iconFile;

  if (typeof nameOrData === "object" && !(nameOrData instanceof FormData)) {
    name = nameOrData.name;
    icon = nameOrData.icon;
  }

  const payload =
    nameOrData instanceof FormData
      ? nameOrData
      : (() => {
          const fd = new FormData();
          if (name) fd.append("name", name);
          if (icon) fd.append("icon", icon);
          return fd;
        })();

  const response = await axiosClient.put(`/api/v1/videogames/${id}`, payload, {
    headers: {
      "Content-Type": "multipart/form-data",
    },
  });

  return response.data;
};
