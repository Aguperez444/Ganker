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

// Revoca el refresh token en el backend al cerrar sesion: sin esto seguiria
// sirviendo para pedir tokens nuevos aunque el jugador ya haya salido (ej. si
// alguien lo copio). Usa axiosRefresh porque no necesita access token y no
// debe disparar el interceptor de 401. Quien la llama no espera el resultado:
// cerrar sesion en el front no puede depender de que el backend responda.
export function revocarRefreshToken(refreshToken) {
  return axiosRefresh.post("/auth/v1/logout", {
    refresh_token: refreshToken,
  });
}

// El interceptor vive fuera de React, asi que no puede llamar al logout() del
// AuthContext directamente. El provider registra aca su forma de limpiar el
// estado cuando monta (ver AuthContext.jsx).
let alExpirarSesion = null;

export function registrarOnSesionExpirada(callback) {
  alExpirarSesion = callback;
}

// Mismo motivo que alExpirarSesion: el refresh silencioso de abajo pisa el
// access_token en localStorage/defaults, pero eso no actualiza el estado
// `tokens` de AuthContext (vive en React, esto vive afuera). Sin este aviso,
// cualquier lector de `tokens` (ej. el token que usa el socket de
// notificaciones en ChatContext) se queda con el valor viejo hasta que el
// jugador recargue la pagina, y si ese socket se reconecta mientras tanto lo
// hace con un token ya vencido.
let alRenovarTokens = null;

export function registrarOnTokensRenovados(callback) {
  alRenovarTokens = callback;
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
    window.location.assign("/");
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

// Endpoints que responden 401 tambien por motivos que no son el token. El
// token vencido o invalido llega siempre como InvalidTokenException
// ("Token inválido...") o, si falta el header, como { detail } de FastAPI:
// cualquier otro 401 de estas rutas es un rechazo de negocio.
const RUTAS_CON_401_DE_NEGOCIO = ["/api/v1/users/register_user"];

function esRechazoDeNegocio(config, response) {
  if (!RUTAS_CON_401_DE_NEGOCIO.some((ruta) => config.url?.includes(ruta))) {
    return false;
  }
  const mensaje = response?.data?.error;
  return typeof mensaje === "string" && !mensaje.startsWith("Token inválido");
}

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

      axiosClient.defaults.headers.common["Authorization"] =
        `Bearer ${access_token}`;

      if (alRenovarTokens) {
        alRenovarTokens({ access_token, refresh_token });
      }

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

    // Tampoco es sesion vencida el 401 de negocio de algunos endpoints (ej.
    // un admin que intenta registrar a un owner, US 39). Refrescar y reintentar
    // repetiria el pedido y, al volver a fallar, cerraria la sesion.
    if (esRechazoDeNegocio(original, error.response)) {
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
