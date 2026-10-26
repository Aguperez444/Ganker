import axiosClient from "./axiosClient";

export function confirmarRegistro(token) {
  return axiosClient
    .post("/auth/v1/confirm-registration", { token })
    .then((res) => res.data);
}

export function reenviarConfirmacionRegistro(email) {
  return axiosClient
    .post("/auth/v1/resend-registration", { email: email.trim() })
    .then((res) => res.data);
}
