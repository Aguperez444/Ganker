import { useCallback, useState } from "react";
import {
  createRank,
  deleteRank,
  getRanksByGame,
  updateRank,
} from "../api/rankApi";
import { logError } from "../utils/logs";

// Errores de modificar/eliminar. Los mensajes de duplicado ("El nombre de
// rango: X ya existe") vienen legibles y se usan tal cual; los que traen IDs
// internos (no encontrado, no se puede eliminar) van con texto propio.
function mapearErrorEdicion(error, accion) {
  const data = error.response?.data;
  const status = error.response?.status;

  if (!error.response) {
    return "No pudimos conectar con el servidor. Intentá de nuevo.";
  }
  if (status === 404) return "El rango no existe o ya fue eliminado.";
  if (
    typeof data?.error === "string" &&
    /no es posible eliminar el rango/i.test(data.error)
  ) {
    return "No se puede eliminar: hay perfiles de jugadores con este rango y es el único rango del videojuego al que reasignarlos.";
  }
  if (typeof data?.error === "string") return data.error;
  if (typeof data?.detail === "string") return data.detail;
  if (status === 400) return "Los datos ingresados no son válidos.";
  if (status === 409) {
    return "Ya existe un rango con ese nombre o valor para este videojuego.";
  }
  return `Ocurrió un error al ${accion} el rango.`;
}

const useRanks = () => {
  const [ranks, setRanks] = useState([]);

  const [isLoading, setIsLoading] = useState(false);
  const [isSaving, setIsSaving] = useState(false);

  const [error, setError] = useState("");
  const [actionError, setActionError] = useState("");

  const loadRanks = useCallback(async (videogameId) => {
    if (!videogameId) {
      setRanks([]);
      return;
    }

    try {
      setIsLoading(true);
      setError("");

      const gameRanks = await getRanksByGame(videogameId);

      setRanks(
        (gameRanks || []).map((rank) => ({
          id: rank.rank_id,
          name: rank.name,
          value: rank.value,
          icon_url: rank.icon_url,
        }))
      );
    } catch (error) {
      logError("Error al cargar rangos:", error);
      setError("No se pudieron cargar los rangos.");
    } finally {
      setIsLoading(false);
    }
  }, []);

  const registerRank = async ({ videogame_id, name, value, icon }) => {
    try {
      setIsSaving(true);
      setActionError("");

      await createRank({ videogame_id, name, value, icon });

      // El endpoint no devuelve un DTO limpio, así que refrescamos desde
      // la fuente de verdad (GET) en vez de confiar en la respuesta del POST.
      await loadRanks(videogame_id);

      return true;
    } catch (error) {
      if (error.response?.data?.error) {
        setActionError(error.response.data.error);
      } else if (error.response?.data?.detail) {
        setActionError(
          typeof error.response.data.detail === "string"
            ? error.response.data.detail
            : "Error de validación al registrar el rango."
        );
      } else if (error.response?.status === 400) {
        setActionError("Los datos ingresados no son válidos.");
      } else if (error.response?.status === 404) {
        setActionError("El videojuego seleccionado no existe.");
      } else if (error.response?.status === 409) {
        setActionError(
          "Ya existe un rango con ese nombre o valor para este videojuego."
        );
      } else {
        setActionError("Ocurrió un error al registrar el rango.");
      }

      return false;
    } finally {
      setIsSaving(false);
    }
  };

  // Modificar rango: el videojuego no cambia, se refresca su lista.
  const editRank = async (rankId, { videogame_id, name, value, icon }) => {
    try {
      setIsSaving(true);
      setActionError("");

      await updateRank(rankId, { name, value, icon });
      await loadRanks(videogame_id);

      return true;
    } catch (error) {
      logError("Error al modificar el rango:", error);
      setActionError(mapearErrorEdicion(error, "modificar"));
      return false;
    } finally {
      setIsSaving(false);
    }
  };

  // Eliminar rango. Devuelve el mensaje de confirmacion del backend, o null.
  const removeRank = async (rankId, videogameId) => {
    try {
      setIsSaving(true);
      setActionError("");

      const resultado = await deleteRank(rankId);
      await loadRanks(videogameId);

      return resultado?.message ?? "El rango ha sido eliminado exitosamente.";
    } catch (error) {
      logError("Error al eliminar el rango:", error);
      setActionError(mapearErrorEdicion(error, "eliminar"));

      // Si ya no existe (otro admin lo borro), se refresca la lista.
      if (error.response?.status === 404) {
        await loadRanks(videogameId);
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
    ranks,
    isLoading,
    isSaving,
    error,
    actionError,
    loadRanks,
    registerRank,
    editRank,
    removeRank,
    clearActionError,
  };
};

export default useRanks;
