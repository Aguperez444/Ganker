import axiosClient from "./axiosClient";

export const getRolesByGame = async (videogameId) => {
  const response = await axiosClient.get(`/api/v1/roles/${videogameId}`);

  return response.data.roles;
};

export const createRole = async ({ videogame_id, name, icon }) => {
  const fd = new FormData();
  fd.append("videogame_id", videogame_id);
  fd.append("name", name);
  fd.append("icon", icon);

  // Sin barra final: la ruta del backend es "/api/v1/roles" (no "/api/v1/roles/").
  await axiosClient.post("/api/v1/roles", fd, {
    headers: {
      "Content-Type": "multipart/form-data",
    },
  });
};

// US 29 - Modificar rol. PUT /api/v1/roles/{role_id} (multipart: name e icon
// opcional). El videojuego no viaja: no se puede cambiar. Si no se manda
// icono, el backend mantiene el actual.
export const updateRole = async (roleId, { name, icon }) => {
  const fd = new FormData();
  fd.append("name", name);
  if (icon) {
    fd.append("icon", icon);
  }

  const response = await axiosClient.put(`/api/v1/roles/${roleId}`, fd, {
    headers: {
      "Content-Type": "multipart/form-data",
    },
  });

  return response.data;
};

// US 30 - Eliminar rol. DELETE /api/v1/roles/{role_id} -> { message }.
// El backend borra el rol de los perfiles que lo tenian, y si un perfil de
// juego se queda sin roles, borra tambien ese perfil.
export const deleteRole = async (roleId) => {
  const response = await axiosClient.delete(`/api/v1/roles/${roleId}`);

  return response.data;
};
