import axios from "axios";
import axiosClient from "./axiosClient";

// El permiso de apelación no es una sesión de Ganker y no se renueva como tal.
const clienteApelacion = axios.create({
  baseURL: import.meta.env.VITE_API_URL,
});
const permiso = (token) => ({ headers: { Authorization: `Bearer ${token}` } });

export async function obtenerMiApelacion(token) {
  return (
    await clienteApelacion.get("/api/v1/ban-appeals/mine", permiso(token))
  ).data;
}

export async function enviarApelacion({ token, texto, imagenes }) {
  const body = new FormData();
  body.append("text", texto.trim());
  imagenes.forEach((archivo) => body.append("images", archivo, archivo.name));
  return (
    await clienteApelacion.post(
      "/api/v1/ban-appeals/mine",
      body,
      permiso(token)
    )
  ).data;
}

export async function buscarApelaciones({
  username,
  estado,
  skip = 0,
  limit = 11,
} = {}) {
  const { data } = await axiosClient.get("/api/v1/ban-appeals", {
    params: {
      username: username || undefined,
      status: estado || undefined,
      skip,
      limit,
    },
  });
  return data.appeals ?? [];
}

export async function obtenerApelacion(id) {
  return (await axiosClient.get(`/api/v1/ban-appeals/${id}`)).data;
}

export async function resolverApelacion(id, decision) {
  return (
    await axiosClient.post(`/api/v1/ban-appeals/${id}/resolve`, { decision })
  ).data;
}
