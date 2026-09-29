import axiosClient from "./axiosClient"; // Asegúrate de ajustar la ruta relativa según dónde esté guardado roleApi.js

// Obtener roles por ID de videojuego
export const getRolesByGame = async (videogame_id) => {
  const response = await axiosClient.get(`/api/v1/roles/${videogame_id}`);
  return response.data;
};

// Crear un rol (con multipart/form-data)
export const createRole = async ({ videogame_id, name, icon }) => {
  const formData = new FormData();
  formData.append("videogame_id", videogame_id);
  formData.append("name", name);
  if (icon) {
    formData.append("icon", icon);
  }

  const response = await axiosClient.post(`/api/v1/roles`, formData, {
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