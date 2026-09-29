import { useCallback, useRef, useState } from "react";
import { getRolesByGame, createRole, updateRole, deleteRole as deleteRoleApi } from "../api/roleApi";
import { DELETE_ROLES_HABILITADO } from "../utils/apiFlags";

const useRoles = () => {
  const [roles, setRoles] = useState([]);
  const [isLoading, setIsLoading] = useState(false);
  const [isSaving, setIsSaving] = useState(false);
  const [error, setError] = useState("");
  const [actionError, setActionError] = useState("");
  // Bajas hechas contra el backend simulado, a la espera de que exista el
  // endpoint DELETE /api/v1/roles/{id}.
  const [solicitudesPendientes, setSolicitudesPendientes] = useState([]);
  // En un ref y no en estado: el backend sigue teniendo el rol, asi que sin
  // esto volveria a aparecer en cada recarga de la lista. Va en ref para que
  // loadRoles pueda leerlo sin cambiar de identidad y disparar efecto en las
  // paginas que dependen de ella.
  const idsEliminados = useRef(new Set());

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
        (gameRoles || [])
          .map((role) => ({
            id: role.role_id || role.id,
            name: role.name,
            description: role.description,
            icon_url: role.icon_url,
            videogame_id: videogameId,
          }))
          .filter((role) => !idsEliminados.current.has(role.id))
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
    // El backend todavia no expone DELETE /api/v1/roles/{id}. Mientras tanto
    // la baja se simula aca: el rol sale de la lista y la peticion que habria
    // que enviar queda guardada en solicitudesPendientes, que es el vector
    // que despues hay que vaciar contra el endpoint real.
    if (!DELETE_ROLES_HABILITADO) {
      const solicitud = {
        method: "DELETE",
        url: `/api/v1/roles/${roleId}`,
        role_id: roleId,
        videogame_id,
        registrada_en: new Date().toISOString(),
      };

      setIsSaving(true);
      setActionError("");

      setSolicitudesPendientes((actuales) => [...actuales, solicitud]);
      idsEliminados.current.add(roleId);
      setRoles((actuales) => actuales.filter((role) => String(role.id) !== String(roleId)));

      setIsSaving(false);

      return true;
    }

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
    solicitudesPendientes,
    loadRoles,
    registerRole,
    editRole,
    deleteRole,
    clearActionError,
  };
};

export default useRoles;