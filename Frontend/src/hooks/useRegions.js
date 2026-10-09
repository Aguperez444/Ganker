import { useCallback, useState } from "react";
import {
  createRegion,
  deleteRegion,
  getRegionsByGame,
  updateRegion,
} from "../api/regionApi";

const getBackendErrorMessage = (error, fallbackMessage) => {
  if (typeof error.response?.data?.error === "string") {
    return error.response.data.error;
  }

  if (typeof error.response?.data?.detail === "string") {
    return error.response.data.detail;
  }

  return fallbackMessage;
};

const useRegions = () => {
  const [regions, setRegions] = useState([]);

  const [isLoading, setIsLoading] = useState(false);
  const [isSaving, setIsSaving] = useState(false);
  const [isDeleting, setIsDeleting] = useState(false);

  const [error, setError] = useState("");
  const [actionError, setActionError] = useState("");

  const loadRegions = useCallback(async (videogameId) => {
    if (!videogameId) {
      setRegions([]);
      setError("");
      return;
    }

    try {
      setIsLoading(true);
      setError("");

      const gameRegions = await getRegionsByGame(videogameId);

      setRegions(
        (gameRegions || []).map((region) => ({
          id: region.region_id,
          name: region.name,
        }))
      );
    } catch (error) {
      console.error("Error al cargar regiones:", error);

      setRegions([]);
      setError("No se pudieron cargar las regiones.");
    } finally {
      setIsLoading(false);
    }
  }, []);

  const registerRegion = async ({ videogame_id, name }) => {
    try {
      setIsSaving(true);
      setActionError("");

      await createRegion({
        videogame_id,
        name,
      });

      await loadRegions(videogame_id);

      return true;
    } catch (error) {
      console.error("Error al registrar región:", error);

      const status = error.response?.status;

      if (status === 400) {
        setActionError(
          getBackendErrorMessage(error, "El nombre de la región no es válido.")
        );
      } else if (status === 404) {
        setActionError("El videojuego seleccionado ya no existe.");
      } else if (status === 409) {
        setActionError(
          getBackendErrorMessage(
            error,
            "Ya existe una región con ese nombre para este videojuego."
          )
        );
      } else {
        setActionError(
          getBackendErrorMessage(
            error,
            "Ocurrió un error al registrar la región."
          )
        );
      }

      return false;
    } finally {
      setIsSaving(false);
    }
  };

  const editRegion = async (regionId, name) => {
    try {
      setIsSaving(true);
      setActionError("");

      const updatedRegion = await updateRegion(regionId, name);

      setRegions((currentRegions) =>
        currentRegions.map((region) =>
          region.id === regionId
            ? {
                id: updatedRegion.region_id ?? region.id,
                name: updatedRegion.name,
              }
            : region
        )
      );

      return true;
    } catch (error) {
      console.error("Error al modificar región:", error);

      const status = error.response?.status;

      if (status === 400) {
        setActionError(
          getBackendErrorMessage(error, "El nombre de la región no es válido.")
        );
      } else if (status === 404) {
        setActionError("La región que intentás modificar ya no existe.");
      } else if (status === 409) {
        setActionError(
          getBackendErrorMessage(
            error,
            "Ya existe otra región con ese nombre para este videojuego."
          )
        );
      } else {
        setActionError(
          getBackendErrorMessage(
            error,
            "Ocurrió un error al modificar la región."
          )
        );
      }

      return false;
    } finally {
      setIsSaving(false);
    }
  };

  const removeRegion = async (regionId) => {
    try {
      setIsDeleting(true);
      setActionError("");

      await deleteRegion(regionId);

      setRegions((currentRegions) =>
        currentRegions.filter((region) => region.id !== regionId)
      );

      return true;
    } catch (error) {
      console.error("Error al eliminar región:", error);

      if (error.response?.status === 404) {
        setActionError("La región que intentás eliminar ya no existe.");
      } else if (error.response?.status === 403) {
        setActionError("No tenés permisos para eliminar esta región.");
      } else {
        setActionError(
          getBackendErrorMessage(
            error,
            "Ocurrió un error al eliminar la región."
          )
        );
      }

      return false;
    } finally {
      setIsDeleting(false);
    }
  };

  const clearActionError = () => {
    setActionError("");
  };

  return {
    regions,

    isLoading,
    isSaving,
    isDeleting,

    error,
    actionError,

    loadRegions,
    registerRegion,
    editRegion,
    removeRegion,
    clearActionError,
  };
};

export default useRegions;
