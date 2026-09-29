import { useCallback, useState } from "react";
import { getRolesByGame, createRole, updateRole, deleteRole as deleteRoleApi } from "../api/roleApi";

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
          id: role.role_id || role.id,
          name: role.name,
          description: role.description,
          icon_url: role.icon_url,
          videogame_id: videogameId,
        }))
      );
    } catch (err) {
      console.error("Error al cargar roles:", err);
      setError("No se pudieron cargar los roles.");
    } finally {
      setIsLoading(false);
    }
  }, []);

  const registerRole = async ({ videogame_id, name, description, icon }) => {
    try {
      setIsSaving(true);
      setActionError("");

      await createRole({ videogame_id, name, description, icon });
      await loadRoles(videogame_id);

      return true;
    } catch (err) {
      if (err.response?.data?.detail) {
        setActionError(
          typeof err.response.data.detail === "string"
            ? err.response.data.detail
            : "Error de validación al registrar el rol."
        );
      } else if (err.response?.status === 409) {
        setActionError("Ya existe un rol con ese nombre para este videojuego.");
      } else {
        setActionError("Ocurrió un error al registrar el rol.");
      }

      return false;
    } finally {
      setIsSaving(false);
    }
  };

  const editRole = async ({ roleId, videogame_id, name, description, icon }) => {
    try {
      setIsSaving(true);
      setActionError("");

      await updateRole({ roleId, name, description, icon });
      await loadRoles(videogame_id);

      return true;
    } catch (err) {
      if (err.response?.data?.detail) {
        setActionError(
          typeof err.response.data.detail === "string"
            ? err.response.data.detail
            : "Error de validación al modificar el rol."
        );
      } else if (err.response?.status === 409) {
        setActionError("Ya existe un rol con ese nombre para este videojuego.");
      } else {
        setActionError("Ocurrió un error al modificar el rol.");
      }

      return false;
    } finally {
      setIsSaving(false);
    }
  };

  const deleteRole = async ({ roleId, videogame_id }) => {
    try {
      setIsSaving(true);
      setActionError("");

      await deleteRoleApi(roleId);
      await loadRoles(videogame_id);

      return true;
    } catch (err) {
      if (err.response?.data?.detail) {
        setActionError(
          typeof err.response.data.detail === "string"
            ? err.response.data.detail
            : "Error al intentar eliminar el rol."
        );
      } else {
        setActionError("Ocurrió un error al eliminar el rol.");
      }

      return false;
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
    deleteRole,
    clearActionError,
  };
};

export default useRoles;