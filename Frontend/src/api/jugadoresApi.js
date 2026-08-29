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