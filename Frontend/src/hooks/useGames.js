import { useCallback, useEffect, useState } from "react";
import { getGames } from "../api/gameApi";

const useGames = () => {
  const [games, setGames] = useState([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState("");

  const loadGames = useCallback(async () => {
    try {
      setIsLoading(true);
      setError("");

      const videogames = await getGames();

      setGames(videogames);
    } catch (error) {
      console.error("Error al cargar videojuegos:", error);
      setError("No se pudieron cargar los videojuegos.");
    } finally {
      setIsLoading(false);
    }
  }, []);

  useEffect(() => {
    loadGames();
  }, [loadGames]);

  return {
    games,
    isLoading,
    error,
    loadGames,
  };
};

export default useGames;
