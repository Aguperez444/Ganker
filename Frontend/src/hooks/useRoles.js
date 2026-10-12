import { useCallback, useState } from "react";
import {
  createRole,
  deleteRole,
  getRolesByGame,
  updateRole,
} from "../api/roleApi";
import { logError } from "../utils/logs";

// Errores de modificar/eliminar (US 29 y 30). El duplicado ("El nombre de
// rol: X ya existe") y el nombre invalido vienen legibles; el 404 trae el id.
function mapearErrorEdicion(error, accion) {
  const data = error.response?.data;
  const status = error.response?.status;

  if (!error.response) {
    return "No pudimos conectar con el servidor. Intentá de nuevo.";
  }
  if (status === 404) return "El rol no existe o ya fue eliminado.";
  if (typeof data?.error === "string") return data.error;
  if (typeof data?.detail === "string") return data.detail;
  if (status === 400) return "Los datos ingresados no son válidos.";
  if (status === 409) {
    return "Ya existe un rol con ese nombre para este videojuego.";
  }
  return `Ocurrió un error al ${accion} el rol.`;
}

const useRoles = () => {
  const [roles, setRoles] = useState([]);

  const [isLoading, setIsLoading] = useState(false);
  const [isSaving, setIsSaving] = useState(false);

  const [error, setError] = useState("");
  const [actionError, setActionError] = useState("");

  const loadRoles = useCallback(async (videogameId) => {
    if (!videogameId) {
      setRoles([]);
      return;
    }

    try {
      setIsLoading(true);
      setError("");

      const gameRoles = await getRolesByGame(videogameId);

      setRoles(
        (gameRoles || []).map((role) => ({
          id: role.role_id,
          name: role.name,
          icon_url: role.icon_url,
        }))
      );
    } catch (error) {
      logError("Error al cargar roles:", error);
      setError("No se pudieron cargar los roles.");
    } finally {
      setIsLoading(false);
    }
  }, []);

  const registerRole = async ({ videogame_id, name, icon }) => {
    try {
      setIsSaving(true);
      setActionError("");

      await createRole({ videogame_id, name, icon });

      // Refrescamos desde la fuente de verdad (GET) en vez de confiar en la
      // respuesta del POST, mismo criterio que useRanks.registerRank.
      await loadRoles(videogame_id);

      return true;
    } catch (error) {
      if (error.response?.data?.error) {
        setActionError(error.response.data.error);
      } else if (error.response?.data?.detail) {
        setActionError(
          typeof error.response.data.detail === "string"
            ? error.response.data.detail
            : "Error de validación al registrar el rol."
        );
      } else if (error.response?.status === 400) {
        setActionError("Los datos ingresados no son válidos.");
      } else if (error.response?.status === 404) {
        setActionError("El videojuego seleccionado no existe.");
      } else if (error.response?.status === 409) {
        setActionError("Ya existe un rol con ese nombre para este videojuego.");
      } else {
        setActionError("Ocurrió un error al registrar el rol.");
      }

      return false;
    } finally {
      setIsSaving(false);
    }
  };

  // US 29 - Modificar rol: el videojuego no cambia, se refresca su lista.
  const editRole = async (roleId, { videogame_id, name, icon }) => {
    try {
      setIsSaving(true);
      setActionError("");

      await updateRole(roleId, { name, icon });
      await loadRoles(videogame_id);

      return true;
    } catch (error) {
      logError("Error al modificar el rol:", error);
      setActionError(mapearErrorEdicion(error, "modificar"));
      return false;
    } finally {
      setIsSaving(false);
    }
  };

  // US 30 - Eliminar rol. Devuelve el mensaje de confirmacion del backend,
  // o null si fallo.
  const removeRole = async (roleId, videogameId) => {
    try {
      setIsSaving(true);
      setActionError("");

      const resultado = await deleteRole(roleId);
      await loadRoles(videogameId);

      return resultado?.message ?? "El rol ha sido eliminado exitosamente.";
    } catch (error) {
      logError("Error al eliminar el rol:", error);
      setActionError(mapearErrorEdicion(error, "eliminar"));

      // Inexistente o ya eliminado: se refresca la lista.
      if (error.response?.status === 404) {
        await loadRoles(videogameId);
      }

      return null;
    } finally {
      setIsSaving(false);
    }
  };

  const clearActionError = () => {
    setActionError("");
  };

  return {
    roles,
    isLoading,
    isSaving,
    error,
    actionError,
    loadRoles,
    registerRole,
    editRole,
    removeRole,
    clearActionError,
  };
};

export default useRoles;
