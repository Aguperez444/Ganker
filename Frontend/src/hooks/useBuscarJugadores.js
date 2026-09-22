import { useEffect, useMemo, useState } from "react";
import { getGames } from "../api/gameApi";
import {
  getCharactersByGame,
  getRanksByGame,
  getRolesByGame,
} from "../api/gameProfileApi";

// TODO US 03 - Buscar jugadores todavia no tiene su propio endpoint de
// busqueda en el backend (falta un GET que reciba videogame_id + filtros
// opcionales de rango/rol/personaje/username y devuelva los jugadores que
// coincidan). El catalogo de videojuegos/rangos/roles/personajes SI es
// real (los mismos endpoints que usa el formulario de perfil de juego,
// ver hooks/useGameProfile.js), pero que rango/rol/personaje "tiene" cada
// uno de estos 3 jugadores de prueba se inventa aca mismo ciclando ese
// catalogo, solo para poder probar que el filtrado combinado funciona de
// punta a punta. Cuando exista el endpoint real, jugadoresDelJuego se
// reemplaza por el resultado de esa consulta.
const JUGADORES_BASE = [
  { user_id: 2, username: "testuser", name: "No name", icon_url: null },
  {
    user_id: 3,
    username: "owner_user",
    name: "owner",
    icon_url: "/media/users/icons/ed3cdc1621d745e28422123f7e2e64c6.png",
  },
  {
    user_id: 4,
    username: "admin_user",
    name: "admin1",
    icon_url: "/media/users/icons/d523a6702e5c42e5beb27441bc93fea9.png",
  },
];

export function useBuscarJugadores() {
  const [games, setGames] = useState([]);
  const [isLoadingGames, setIsLoadingGames] = useState(true);
  const [gamesError, setGamesError] = useState("");

  const [selectedGameId, setSelectedGameId] = useState("");
  const [ranks, setRanks] = useState([]);
  const [roles, setRoles] = useState([]);
  const [characters, setCharacters] = useState([]);
  const [isLoadingGameData, setIsLoadingGameData] = useState(false);
  const [gameDataError, setGameDataError] = useState("");

  const [rankId, setRankId] = useState("");
  const [roleId, setRoleId] = useState("");
  const [characterId, setCharacterId] = useState("");
  const [username, setUsername] = useState("");

  useEffect(() => {
    let cancelado = false;

    const cargarJuegos = async () => {
      try {
        setIsLoadingGames(true);
        setGamesError("");

        const videojuegos = await getGames();
        if (!cancelado) setGames(videojuegos ?? []);
      } catch (error) {
        console.error("Error al cargar videojuegos:", error);
        if (!cancelado) {
          setGamesError("No se pudieron cargar los videojuegos disponibles.");
        }
      } finally {
        if (!cancelado) setIsLoadingGames(false);
      }
    };

    cargarJuegos();
    return () => {
      cancelado = true;
    };
  }, []);

  useEffect(() => {
    let cancelado = false;

    const cargarDatosDelJuego = async () => {
      if (!selectedGameId) {
        setRanks([]);
        setRoles([]);
        setCharacters([]);
        return;
      }

      try {
        setIsLoadingGameData(true);
        setGameDataError("");

        const [gameRanks, gameRoles, gameCharacters] = await Promise.all([
          getRanksByGame(selectedGameId),
          getRolesByGame(selectedGameId),
          getCharactersByGame(selectedGameId),
        ]);

        if (cancelado) return;
        setRanks(gameRanks ?? []);
        setRoles(gameRoles ?? []);
        setCharacters(gameCharacters ?? []);
      } catch (error) {
        console.error("Error al cargar los datos del videojuego:", error);
        if (!cancelado) {
          setRanks([]);
          setRoles([]);
          setCharacters([]);
          setGameDataError(
            "No se pudieron cargar los rangos, roles y personajes de este videojuego."
          );
        }
      } finally {
        if (!cancelado) setIsLoadingGameData(false);
      }
    };

    cargarDatosDelJuego();
    return () => {
      cancelado = true;
    };
  }, [selectedGameId]);

  const limpiarFiltros = () => {
    setRankId("");
    setRoleId("");
    setCharacterId("");
    setUsername("");
  };

  const selectGame = (gameId) => {
    setSelectedGameId(gameId);
    limpiarFiltros();
  };

  const jugadoresDelJuego = useMemo(() => {
    if (
      !selectedGameId ||
      ranks.length === 0 ||
      roles.length === 0 ||
      characters.length === 0
    ) {
      return [];
    }

    return JUGADORES_BASE.map((jugador, indice) => ({
      ...jugador,
      rank: ranks[indice % ranks.length],
      role: roles[indice % roles.length],
      character: characters[indice % characters.length],
    }));
  }, [selectedGameId, ranks, roles, characters]);

  const resultados = useMemo(() => {
    const usernameBuscado = username.trim().toLowerCase();

    return jugadoresDelJuego.filter((jugador) => {
      if (rankId && String(jugador.rank?.rank_id) !== String(rankId)) {
        return false;
      }
      if (roleId && String(jugador.role?.role_id) !== String(roleId)) {
        return false;
      }
      if (
        characterId &&
        String(jugador.character?.character_id) !== String(characterId)
      ) {
        return false;
      }
      if (
        usernameBuscado &&
        !jugador.username.toLowerCase().includes(usernameBuscado)
      ) {
        return false;
      }
      return true;
    });
  }, [jugadoresDelJuego, rankId, roleId, characterId, username]);

  const hayFiltrosOpcionales = Boolean(
    rankId || roleId || characterId || username.trim()
  );

  return {
    games,
    isLoadingGames,
    gamesError,

    selectedGameId,
    selectGame,

    ranks,
    roles,
    characters,
    isLoadingGameData,
    gameDataError,

    rankId,
    roleId,
    characterId,
    username,
    setRankId,
    setRoleId,
    setCharacterId,
    setUsername,
    limpiarFiltros,
    hayFiltrosOpcionales,

    resultados,
  };
}

export default useBuscarJugadores;
