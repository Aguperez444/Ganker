import axiosClient from "./axiosClient";

export function registrarJugador({ nombre, username, mail, password }) {
  return axiosClient
    .post("/api/v1/players/", {
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
  return axiosClient.get("/api/v1/players/me").then((res) => res.data);
}

// Actualiza los datos de la cuenta del jugador logueado (US 02).
// El backend saca el id del token, por eso no se manda en el body.
// Devuelve { player_id, username, name, mail }: la misma forma que /me.
export function actualizarJugador({ nombre, username, mail }) {
  return axiosClient
    .put("/api/v1/players/", {
      name: nombre,
      username,
      mail,
    })
    .then((res) => res.data);
}
