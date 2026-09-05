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

// MIENTRAS EL BACKEND NO TENGA EL ENDPOINT: comentar la funcion de arriba y
// descomentar esta para poder probar la UI. Es lo unico que hay que tocar.
//
// export function obtenerJugadorActual() {
//   return Promise.resolve({
//     player_id: 1,
//     username: "joaco_gg",
//     name: "Joaquin Trabucco",
//     mail: "joaco@ejemplo.com",
//   });
// }
