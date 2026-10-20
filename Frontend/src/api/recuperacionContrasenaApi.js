import axiosClient from "./axiosClient";

// US 34 - Cambiar contraseña. Ninguno de los dos endpoints necesita sesion.

// POST /auth/v1/forgot-password -> { message }. Responde siempre lo mismo
// (exista o no la cuenta) para no revelar que mails estan registrados; si
// existe, el backend manda el mail con el link a /reset-password?token=...
export function solicitarRecuperacion(email) {
  return axiosClient
    .post("/auth/v1/forgot-password", { email: email.trim() })
    .then((res) => res.data);
}

// POST /auth/v1/reset-password -> { message }. El token vale 15 minutos y es
// de un solo uso; si vencio, ya se uso o la contraseña no es segura, responde
// 400 con { error } legible.
export function restablecerContrasena(token, nuevaPassword) {
  return axiosClient
    .post("/auth/v1/reset-password", {
      token,
      new_password: nuevaPassword,
    })
    .then((res) => res.data);
}
