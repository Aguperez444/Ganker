import { useCallback, useState } from "react";
import { createRole, getRolesByGame } from "../api/roleApi";

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
      console.error("Error al cargar roles:", error);
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
    clearActionError,
  };
};

export default useRoles;
