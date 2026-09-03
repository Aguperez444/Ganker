import { createContext, useContext, useState, useEffect } from "react";
import axiosClient from "../api/axiosClient";

const AuthContext = createContext(null);

export function AuthProvider({ children }) {
  const [user, setUser] = useState(null);
  const [tokens, setTokens] = useState(null);
  const [isAuthenticated, setIsAuthenticated] = useState(false);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const storedTokens = localStorage.getItem("access_token");
    const storedRefresh = localStorage.getItem("refresh_token");
    const storedUser = localStorage.getItem("user");

    if (storedTokens && storedRefresh) {
      setTokens({
        access_token: storedTokens,
        refresh_token: storedRefresh,
        token_type: "Bearer",
      });
      setIsAuthenticated(true);
      if (storedUser) {
        setUser(JSON.parse(storedUser));
      }
    }
    setLoading(false);
  }, []);

  // Guarda una sesion iniciada en el estado global y en localStorage.
  // "tokens" tiene la forma { access_token, refresh_token, token_type } que
  // devuelve tanto el registro como el login. Opcionalmente se puede pasar el
  // objeto del usuario logueado en "datosUsuario".
  const guardarSesion = (tokens, datosUsuario = null) => {
    const { access_token, refresh_token, token_type } = tokens;

    localStorage.setItem("access_token", access_token);
    localStorage.setItem("refresh_token", refresh_token);
    setTokens({ access_token, refresh_token, token_type });
    setIsAuthenticated(true);

    if (datosUsuario) {
      setUser(datosUsuario);
      localStorage.setItem("user", JSON.stringify(datosUsuario));
    }

    if (access_token) {
      axiosClient.defaults.headers.common["Authorization"] = `Bearer ${access_token}`;
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

      guardarSesion({ access_token, refresh_token, token_type }, { email });

      return { success: true };
    } catch (error) {
      console.error("Error en el login:", error.response?.data || error.message);
      return { success: false, error: error.response?.data || error.message };
    }
  };

  const logout = () => {
    localStorage.removeItem("access_token");
    localStorage.removeItem("refresh_token");
    localStorage.removeItem("user");
    delete axiosClient.defaults.headers.common["Authorization"];
    setTokens(null);
    setUser(null);
    setIsAuthenticated(false);
  };

  const value = {
    user,
    tokens,
    isAuthenticated,
    loading,
    login,
    logout,
    guardarSesion,
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
