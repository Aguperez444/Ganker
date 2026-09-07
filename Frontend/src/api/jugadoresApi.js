import axiosClient from "./axiosClient";

export function registrarJugador({ nombre, username, mail, password }) {
  return axiosClient
    .post("/api/v1/users/register", {
      name: nombre,
      username,
      mail,
      password,
    })
    .then((res) => res.data); // { access_token, refresh_token, token_type }
}

// Datos del jugador dueño del token. Es la UNICA fuente de `user` en el front:
// lo llama AuthContext al iniciar sesion, al registrarse y al recargar la pagina.
export function obtenerJugadorActual() {
  return axiosClient.get("/api/v1/users/me").then((res) => res.data);
}

// Actualiza los datos de la cuenta del jugador logueado (US 02).
// El backend saca el id del token, por eso no se manda en el body.
// Devuelve { user_id, username, name, mail }.
export function actualizarJugador({ nombre, username, mail }) {
  return axiosClient
    .put("/api/v1/users/", {
      name: nombre,
      username,
      mail,
    })
    .then((res) => res.data);
}
