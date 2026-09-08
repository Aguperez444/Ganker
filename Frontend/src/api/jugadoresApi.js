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
