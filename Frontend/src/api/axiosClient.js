import axios from "axios";

// Las mismas claves que usa AuthContext para leer/escribir en localStorage.
export const CLAVES_SESION = {
  access: "access_token",
  refresh: "refresh_token",
  user: "user",
};

// Cliente HTTP unico para todo el proyecto.
// La URL base sale de la variable VITE_API_URL definida en el .env de cada dev.
const axiosClient = axios.create({
  baseURL: import.meta.env.VITE_API_URL,
  headers: {
    "Content-Type": "application/json",
  },
});

// Cliente aparte, SIN interceptores, exclusivo para pedir el refresh.
// Si usaramos axiosClient para eso y el refresh fallara con 401, el interceptor
// se dispararia a si mismo en un loop infinito.
const axiosRefresh = axios.create({
  baseURL: import.meta.env.VITE_API_URL,
  headers: {
    "Content-Type": "application/json",
  },
});

// El interceptor vive fuera de React, asi que no puede llamar al logout() del
// AuthContext directamente. El provider registra aca su forma de limpiar el
// estado cuando monta (ver AuthContext.jsx).
let alExpirarSesion = null;

export function registrarOnSesionExpirada(callback) {
  alExpirarSesion = callback;
}

function limpiarSesion() {
  localStorage.removeItem(CLAVES_SESION.access);
  localStorage.removeItem(CLAVES_SESION.refresh);
  localStorage.removeItem(CLAVES_SESION.user);
  delete axiosClient.defaults.headers.common["Authorization"];

  if (alExpirarSesion) {
    alExpirarSesion();
  } else {
    // Respaldo por si nadie registro nada todavia (ej. el provider no monto).
    window.location.assign("/login");
  }
}

// Adjunta el token en cada pedido, leyendolo siempre de localStorage.
// Esto hace que la sesion funcione tambien despues de recargar la pagina,
// sin depender de que alguien reponga defaults.headers a mano.
axiosClient.interceptors.request.use((config) => {
  const token = localStorage.getItem(CLAVES_SESION.access);
  if (token) {
    config.headers.Authorization = `Bearer ${token}`;
  }
  return config;
});

// Si varios pedidos fallan con 401 al mismo tiempo, no queremos disparar varios
// refresh en paralelo: el primero crea la promesa y el resto espera la misma.
let promesaDeRefresh = null;

function refrescarTokens() {
  if (promesaDeRefresh) return promesaDeRefresh;

  const refreshToken = localStorage.getItem(CLAVES_SESION.refresh);
  if (!refreshToken) {
    return Promise.reject(new Error("No hay refresh token guardado."));
  }

  promesaDeRefresh = axiosRefresh
    .post("/auth/v1/refresh", { refresh_token: refreshToken })
    .then((res) => {
      const { access_token, refresh_token } = res.data;

      localStorage.setItem(CLAVES_SESION.access, access_token);
      // El backend rota el refresh token: devuelve uno nuevo en cada refresh
      // y el anterior queda invalidado. Hay que pisar el guardado.
      if (refresh_token) {
        localStorage.setItem(CLAVES_SESION.refresh, refresh_token);
      }

      axiosClient.defaults.headers.common["Authorization"] = `Bearer ${access_token}`;
      return access_token;
    })
    .finally(() => {
      promesaDeRefresh = null;
    });

  return promesaDeRefresh;
}

axiosClient.interceptors.response.use(
  (response) => response,
  async (error) => {
    const original = error.config;

    // Solo nos interesa el 401; cualquier otro error sigue su curso normal.
    if (error.response?.status !== 401 || !original) {
      return Promise.reject(error);
    }

    // IMPORTANTE: un 401 en el login NO es sesion vencida, es contraseña
    // incorrecta. Si lo tratamos como sesion vencida, romperiamos el mensaje
    // de error que muestra useIniciarSesion.
    if (original.url?.includes("/auth/v1/login")) {
      return Promise.reject(error);
    }

    // Si este pedido ya se reintento una vez, el refresh no alcanzo.
    if (original._reintentado) {
      limpiarSesion();
      return Promise.reject(error);
    }

    original._reintentado = true;

    try {
      const nuevoToken = await refrescarTokens();
      original.headers.Authorization = `Bearer ${nuevoToken}`;
      return axiosClient(original);
    } catch (errorDeRefresh) {
      limpiarSesion();
      return Promise.reject(errorDeRefresh);
    }
  }
);

export default axiosClient;