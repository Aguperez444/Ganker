import axiosClient from "./axiosClient";

// Login con mail y contraseña. El backend usa OAuth2PasswordRequestForm, por
// eso va como form-urlencoded y el mail viaja en el campo `username`.
//
// Devuelve { access_token, refresh_token, token_type }.
export function iniciarSesion(email, password) {
  return axiosClient
    .post(
      "/auth/v1/login",
      new URLSearchParams({ username: email, password }),
      { headers: { "Content-Type": "application/x-www-form-urlencoded" } }
    )
    .then((res) => res.data);
}
