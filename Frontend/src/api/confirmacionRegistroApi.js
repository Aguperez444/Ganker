import axiosClient from "./axiosClient";

// Confirmación de registro por mail. Ninguno de los dos endpoints necesita
// sesion: la cuenta recien se crea al confirmar.

// POST /auth/v1/confirm-registration -> { message }. El token llega en el link
// del mail (/confirm-registration?token=...), vale 24 horas y es de un solo
// uso; si vencio o ya se uso responde 400 con { error } legible.
export function confirmarRegistro(token) {
  return axiosClient
    .post("/auth/v1/confirm-registration", { token })
    .then((res) => res.data);
}

// POST /auth/v1/resend-registration -> { message }. Responde siempre lo mismo
// (haya o no un registro pendiente) e invalida el link anterior. Limitado por
// IP y por mail: al pasarse responde 429 con { error }.
export function reenviarConfirmacionRegistro(email) {
  return axiosClient
    .post("/auth/v1/resend-registration", { email: email.trim() })
    .then((res) => res.data);
}
