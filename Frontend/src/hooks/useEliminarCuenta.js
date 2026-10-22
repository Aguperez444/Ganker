import { startTransition, useState } from "react";
import { useNavigate } from "react-router-dom";
import { eliminarMiCuenta } from "../api/jugadoresApi";
import { useAuth } from "../context/AuthContext";
import { logError } from "../utils/logs";

export const MENSAJE_CUENTA_ELIMINADA =
  "Tu cuenta de Ganker fue dada de baja correctamente.";

function mensajeDeError(error) {
  const status = error.response?.status;
  const data = error.response?.data;

  if (!error.response) {
    return "No pudimos conectar con el servidor. Intentá de nuevo.";
  }
  if (status === 404) return "Tu cuenta no existe o ya fue eliminada.";
  if (status === 401) return "Tu sesión no es válida o ha expirado.";
  if (typeof data?.error === "string") return data.error;
  if (typeof data?.detail === "string") return data.detail;
  return "Ocurrió un error al eliminar tu cuenta.";
}

// US 04 - Eliminar jugador.
// La confirmacion explicita es escribir el nombre de usuario: hasta que no
// coincide, `puedeConfirmar` queda en false y el modal no deja eliminar.
// Si sale bien se cierra la sesion local (el backend ya revoco los tokens) y
// se va al login con el aviso de baja.
export function useEliminarCuenta() {
  const { user, logout } = useAuth();
  const navigate = useNavigate();

  const [abierto, setAbierto] = useState(false);
  const [confirmacion, setConfirmacion] = useState("");
  const [cargando, setCargando] = useState(false);
  const [error, setError] = useState("");

  const puedeConfirmar =
    Boolean(user?.username) && confirmacion.trim() === user.username;

  function abrir() {
    setConfirmacion("");
    setError("");
    setAbierto(true);
  }

  function cancelar() {
    setConfirmacion("");
    setError("");
    setAbierto(false);
  }

  async function confirmar() {
    if (!puedeConfirmar) {
      setError("Escribí tu nombre de usuario para confirmar la baja.");
      return false;
    }

    try {
      setCargando(true);
      setError("");

      await eliminarMiCuenta();

      // React Router hace la navegacion dentro de una transicion: si el logout
      // quedara afuera se renderizaria antes y ProtectedRoute mandaria a la
      // landing. En la misma transicion, ambos cambios se aplican juntos.
      startTransition(() => {
        navigate("/login", {
          replace: true,
          state: { mensaje: MENSAJE_CUENTA_ELIMINADA },
        });
        logout();
      });
      return true;
    } catch (error) {
      logError("Error al eliminar la cuenta:", error);
      setError(mensajeDeError(error));
      return false;
    } finally {
      setCargando(false);
    }
  }

  return {
    abierto,
    confirmacion,
    puedeConfirmar,
    cargando,
    error,
    setConfirmacion,
    abrir,
    cancelar,
    confirmar,
  };
}
