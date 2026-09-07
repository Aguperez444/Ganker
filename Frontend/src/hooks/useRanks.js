import { useCallback, useState } from "react";
import { createRank, getRanksByGame } from "../api/rankApi";

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
      console.error("Error al cargar rangos:", error);
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
        setActionError("Ya existe un rango con ese nombre o valor para este videojuego.");
      } else {
        setActionError("Ocurrió un error al registrar el rango.");
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
    ranks,
    isLoading,
    isSaving,
    error,
    actionError,
    loadRanks,
    registerRank,
    clearActionError,
  };
};

export default useRanks;
