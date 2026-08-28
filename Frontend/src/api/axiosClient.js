import axios from "axios";

// Cliente HTTP unico para todo el proyecto.
// La URL base sale de la variable VITE_API_URL definida en el .env de cada dev.
const axiosClient = axios.create({
  baseURL: import.meta.env.VITE_API_URL,
  headers: {
    "Content-Type": "application/json",
  },
});

export default axiosClient;
