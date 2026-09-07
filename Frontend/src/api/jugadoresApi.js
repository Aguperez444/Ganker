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
// Según la nueva firma del backend (update_user.txt):
// PUT /api/v1/users/
// username: str = Form(...)
// name: str = Form(...)
// mail: str = Form(...)
// icon: UploadFile = File(...)
// Devuelve UpdateUserResponse: { user_id, username, name, mail, icon_url }.
export function actualizarJugador(datos) {
  let formData;
  if (datos instanceof FormData) {
    formData = datos;
  } else {
    formData = new FormData();
    formData.append("username", datos.username);
    formData.append("name", datos.nombre ?? datos.name ?? "");
    formData.append("mail", datos.mail ?? "");
    if (datos.icon) {
      formData.append("icon", datos.icon, datos.icon.name || "avatar.png");
    }
  }

  return axiosClient
    .put("/api/v1/users/", formData, {
      headers: {
        "Content-Type": "multipart/form-data",
      },
    })
    .then((res) => res.data);
}
