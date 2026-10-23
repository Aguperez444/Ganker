import axiosClient from "./axiosClient";

export function registrarJugador({ nombre, username, mail, password }) {
  return axiosClient
    .post("/api/v1/users/register", {
      name: nombre,
      username,
      mail,
      password,
    })
    .then((res) => res.data); // { message }: solicita confirmar el correo antes de crear la cuenta.
}

// Datos del jugador dueño del token. Es la UNICA fuente de `user` en el front:
// lo llama AuthContext al iniciar sesion, al completar el registro federado y al recargar.
export function obtenerJugadorActual() {
  return axiosClient.get("/api/v1/users/me").then((res) => res.data);
}

// Actualiza los datos de la cuenta del jugador logueado (US 02).
// El backend saca el id del token, por eso no se manda en el body.
//
// Va como multipart/form-data porque el endpoint recibe la foto de perfil:
//   PUT /api/v1/users/  ->  username, name, mail (Form) + icon (File)
//
// `icon` se adjunta solo si el jugador eligio una foto nueva. Hoy el backend
// lo declara obligatorio (File(...)), asi que un guardado sin foto responde
// 422; queda pendiente que lo pase a File(None).
//
// Devuelve { user_id, username, name, mail, icon_url }.
export function actualizarJugador({ nombre, username, mail, icon }) {
  const formData = new FormData();
  formData.append("username", username);
  formData.append("name", nombre);
  formData.append("mail", mail);

  if (icon) {
    formData.append("icon", icon, icon.name || "avatar.png");
  }

  return axiosClient
    .put("/api/v1/users/", formData, {
      headers: { "Content-Type": "multipart/form-data" },
    })
    .then((res) => res.data);
}

// US 04 - Eliminar jugador. DELETE /api/v1/users/me -> { message }.
// Borrado logico: el backend marca deleted = True en el usuario y en cascada
// en sus perfiles de juego (con sus roles x rangos), y revoca sus tokens.
export function eliminarMiCuenta() {
  return axiosClient.delete("/api/v1/users/me").then((res) => res.data);
}

// US 50 - Eliminar cuenta de usuario (admin). DELETE /api/v1/users/{id} ->
// { message }. Requiere admin u owner; mismo borrado logico en cascada y
// revocacion de tokens que la baja propia.
export function eliminarUsuario(userId) {
  return axiosClient.delete(`/api/v1/users/${userId}`).then((res) => res.data);
}

// Perfil de OTRO jugador (para entrar desde buscar jugadores, el chat o un
// equipo): sus datos visibles y todos sus perfiles de juego. No trae el mail.
//
// Devuelve { user_id, username, name, icon_url, last_connection, profiles }.
export function obtenerPerfilJugador(userId) {
  return axiosClient
    .get(`/api/v1/users/${userId}/profile`)
    .then((res) => res.data);
}

// Busqueda de usuarios por username: coincidencia parcial y sin distinguir
// mayusculas, solo usuarios activos (ni eliminados ni baneados), ordenados
// por username. GET /api/v1/users/search?username=&page=&size= (size <= 100).
//
// Devuelve [{ user_id, username, name, icon_url }].
export function buscarUsuarios(username, { page = 1, size = 20 } = {}) {
  return axiosClient
    .get("/api/v1/users/search", { params: { username, page, size } })
    .then((res) => res.data);
}

// US 39 - Registrar usuario (admin). POST /api/v1/users/register_user.
// Requiere admin u owner; un admin no puede registrar a un owner (eso lo
// valida el backend y responde 401).
//
// Devuelve { user_id, username, name, mail, role }.
export function registrarUsuario({ nombre, username, mail, password, rol }) {
  return axiosClient
    .post("/api/v1/users/register_user", {
      name: nombre,
      username,
      mail,
      password,
      role: rol,
    })
    .then((res) => res.data);
}
