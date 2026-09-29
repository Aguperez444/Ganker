import axiosClient from "./axiosClient";

export const getRolesByGame = async (videogameId) => {
  const response = await axiosClient.get(`/api/v1/roles/${videogameId}`);

  return response.data.roles;
};

export const createRole = async ({ videogame_id, name, icon }) => {
  const fd = new FormData();
  fd.append("videogame_id", videogame_id);
  fd.append("name", name);
  if (icon) {
      fd.append("icon", icon);
  }



  // Sin barra final: la ruta del backend es "/api/v1/roles" (no "/api/v1/roles/").
  await axiosClient.post("/api/v1/roles", fd, {
    headers: {
      "Content-Type": "multipart/form-data",
    },
  });
  return response.data;
};

// Modificar un rol existente
export const updateRole = async ({ roleId, name, icon }) => {
  const formData = new FormData();
  formData.append("name", name);
  if (icon) {
    formData.append("icon", icon);
  }

  const response = await axiosClient.put(`/api/v1/roles/${roleId}`, formData, {
    headers: {
      "Content-Type": "multipart/form-data",
    },
  });
  return response.data;
};

// Eliminar un rol
export const deleteRole = async (roleId) => {
  const response = await axiosClient.delete(`/api/v1/roles/${roleId}`);
  return response.data;
};
