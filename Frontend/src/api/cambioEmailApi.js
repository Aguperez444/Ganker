import axiosClient from "./axiosClient";

export function solicitarCambioEmail({ mail, password }) {
  return axiosClient
    .post("/api/v1/users/me/email-change", { mail, password })
    .then((res) => res.data);
}

export function confirmarCambioEmail(token) {
  return axiosClient
    .post("/auth/v1/confirm-email-change", { token })
    .then((res) => res.data);
}
