import { createContext, useContext, useState, useEffect } from "react";
import axiosClient, { registrarOnSesionExpirada } from "../api/axiosClient";
import { obtenerJugadorActual } from "../api/jugadoresApi";

const AuthContext = createContext(null);

/**
 * Estado global de la sesion.
 *
 * `user` es el jugador logueado y tiene SIEMPRE la forma que devuelve
 * GET /api/v1/players/me:
 *
 *   { player_id, username, name, mail }    (mas adelante tambien `role`)
 *
 * Regla: `user` lo escribe unicamente este provider, con lo que manda el
 * backend. Ninguna pantalla lo arma a mano. Antes cada page se lo pasaba a
 * guardarSesion() y terminaba distinto segun por donde entraba el usuario: el
 * login guardaba solo { email } y el registro no guardaba nada, asi que el
 * recien registrado se quedaba con user = null y cualquier pantalla que leyera
 * user.algo se rompia.
 *
 * Invariante: si `isAuthenticated` es true y `loading` es false, `user` esta
 * completo. Los consumidores pueden leerlo sin chequear null.
 */
export function AuthProvider({ children }) {
  const [user, setUser] = useState(null);
  const [tokens, setTokens] = useState(null);
  const [isAuthenticated, setIsAuthenticated] = useState(false);
  const [loading, setLoading] = useState(true);

  const cargarUsuario = async () => {
    const datos = await obtenerJugadorActual();
    setUser(datos);
  };

  // Vuelve a pedir el usuario al backend. La usan las pantallas que modifican
  // datos de la cuenta (US 02): en vez de escribir `user` con lo que devolvio
  // el PUT, piden que se recargue, asi la unica fuente sigue siendo /me.
  const refrescarUsuario = async () => {
    await cargarUsuario();
  };

  const limpiarEstado = () => {
    setTokens(null);
    setUser(null);
    setIsAuthenticated(false);
  };

  const logout = () => {
    localStorage.removeItem("access_token");
    localStorage.removeItem("refresh_token");
    // Ya no guardamos el usuario en localStorage, pero lo seguimos borrando
    // para limpiar el valor viejo de las sesiones abiertas antes de este cambio.
    localStorage.removeItem("user");
    limpiarEstado();
  };

  useEffect(() => {
    // Al montar restauramos la sesion desde localStorage. El usuario NO sale de
    // ahi: se lo pedimos al backend, asi los datos estan siempre frescos aunque
    // el jugador haya editado su perfil desde otro dispositivo.
    const restaurarSesion = async () => {
      const access = localStorage.getItem("access_token");
      const refresh = localStorage.getItem("refresh_token");

      if (access && refresh) {
        setTokens({ access_token: access, refresh_token: refresh, token_type: "Bearer" });
        setIsAuthenticated(true);

        try {
          await cargarUsuario();
        } catch {
          // Si no podemos traer al jugador, no hay sesion. Vale para cualquier
          // motivo: token vencido, /me caido o el endpoint todavia inexistente.
          //
          // No alcanza con delegar en el interceptor de axiosClient: ese solo
          // reacciona al 401. Con un 404 o un 500 la sesion quedaria con
          // isAuthenticated en true y user en null, que es justo el estado a
          // medias que este provider tiene que evitar.
          logout();
        }
      }

      // OJO: tiene que quedar DESPUES del await. Si loading baja antes, las
      // rutas protegidas se renderizan con user todavia en null.
      setLoading(false);
    };

    restaurarSesion();
  }, []);

  useEffect(() => {
    registrarOnSesionExpirada(limpiarEstado);
  }, []);

  // Guarda una sesion recien creada y trae al usuario. Recibe
  // { access_token, refresh_token, token_type }, que es lo que devuelven tanto
  // el login como el registro.
  //
  // No recibe datos del usuario a proposito: es lo que impide que una pantalla
  // vuelva a armar `user` por su cuenta.
  const guardarSesion = async ({ access_token, refresh_token, token_type }) => {
    localStorage.setItem("access_token", access_token);
    localStorage.setItem("refresh_token", refresh_token);
    setTokens({ access_token, refresh_token, token_type });
    setIsAuthenticated(true);

    try {
      await cargarUsuario();
    } catch (error) {
      // O la sesion queda completa, o no queda sesion. Dejarla a medias es
      // volver al bug de user en null.
      logout();
      throw error;
    }
  };

  const login = async (email, password) => {
    try {
      const response = await axiosClient.post("/auth/v1/login/",
        new URLSearchParams({
          username: email,
          password: password,
        }),
        {
          headers: { "Content-Type": "application/x-www-form-urlencoded" },
        }
      );

      const { access_token, refresh_token, token_type } = response.data;

      await guardarSesion({ access_token, refresh_token, token_type });

      return { success: true };
    } catch (error) {
      console.error("Error en el login:", error.response?.data || error.message);
      return {
        success: false,
        status: error.response?.status,
        error: error.response?.data || error.message,
      };
    }
  };

  const value = {
    user,
    tokens,
    isAuthenticated,
    loading,
    login,
    logout,
    guardarSesion,
    refrescarUsuario,
  };

  return (
    <AuthContext.Provider value={value}>
      {children}
    </AuthContext.Provider>
  );
}

export function useAuth() {
  const context = useContext(AuthContext);
  if (!context) {
    throw new Error("useAuth debe ser usado dentro de un AuthProvider");
  }
  return context;
}
