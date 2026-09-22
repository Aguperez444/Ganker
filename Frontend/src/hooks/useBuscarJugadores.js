import { useEffect, useMemo, useState } from "react";
import { getGames } from "../api/gameApi";
import {
  getCharactersByGame,
  getRanksByGame,
  getRolesByGame,
  searchGameProfiles,
} from "../api/gameProfileApi";

// El filtro de username exige minimo 4 caracteres del lado del backend
// (SearchVideogameProfilesRequest.name, Field(min_length=4)); mandar menos
// tira un 422. Por debajo de eso simplemente no se manda el filtro.
const LARGO_MINIMO_USERNAME = 4;

const RESULTADOS_POR_PAGINA = 6;

// El backend soporta paginar (page/page_size) pero no ordenar (no hay
// ORDER BY en la query). Para poder ofrecer un orden y una paginacion
// consistentes SIN tocar el backend, se le pide de una todo lo que matchee
// el filtro (ver MAX_RESULTADOS_A_TRAER mas abajo) y el orden + la paginacion
// se resuelven aca, en memoria. Si el catalogo de jugadores creciera mucho
// esto dejaria de ser lo ideal (habria que paginar/ordenar en el backend),
// pero para el volumen actual evita esa vuelta.
const MAX_RESULTADOS_A_TRAER = 500;

// Los jugadores sin last_connection quedan siempre al final, para
// cualquiera de los dos ordenes.
const ORDENES = {
  reciente: (a, b) => {
    if (!a.last_connection) return 1;
    if (!b.last_connection) return -1;
    return new Date(b.last_connection) - new Date(a.last_connection);
  },
  antiguo: (a, b) => {
    if (!a.last_connection) return 1;
    if (!b.last_connection) return -1;
    return new Date(a.last_connection) - new Date(b.last_connection);
  },
};

// Adapta la respuesta real del backend ({ player: { player_id, player_name,
// icon_url, last_connection }, characters: [...], role_profiles: [...] })
// a la forma que ya esperan JugadorCardComponent y esta pagina. El backend
// no tiene un campo de "nombre para mostrar" separado del username (solo
// player_name), asi que se usa el mismo valor para los dos.
function mapearPerfilAJugador(perfil) {
  return {
    user_id: perfil.player.player_id,
    username: perfil.player.player_name,
    name: perfil.player.player_name,
    icon_url: perfil.player.icon_url,
    last_connection: perfil.player.last_connection,
    characters: perfil.characters,
    role_profiles: perfil.role_profiles,
  };
}

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
  const [pagina, setPagina] = useState(1);
  const [orden, setOrden] = useState("");

  // Todos los jugadores que matchean el filtro actual (sin ordenar ni
  // paginar todavia): ver MAX_RESULTADOS_A_TRAER arriba.
  const [todosLosResultados, setTodosLosResultados] = useState([]);
  const [isLoadingResultados, setIsLoadingResultados] = useState(false);
  const [resultadosError, setResultadosError] = useState("");

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

  useEffect(() => {
    let cancelado = false;

    const buscarJugadores = async () => {
      if (!selectedGameId) {
        setTodosLosResultados([]);
        return;
      }

      const usernameBuscado = username.trim();

      try {
        setIsLoadingResultados(true);
        setResultadosError("");

        const perfiles = await searchGameProfiles({
          videogame_id: Number(selectedGameId),
          ranks: rankId ? [Number(rankId)] : undefined,
          roles: roleId ? [Number(roleId)] : undefined,
          characters: characterId ? [Number(characterId)] : undefined,
          name:
            usernameBuscado.length >= LARGO_MINIMO_USERNAME
              ? usernameBuscado
              : undefined,
          page: 1,
          page_size: MAX_RESULTADOS_A_TRAER,
        });

        if (!cancelado) {
          setTodosLosResultados((perfiles ?? []).map(mapearPerfilAJugador));
        }
      } catch (error) {
        console.error("Error al buscar jugadores:", error);
        if (!cancelado) {
          setTodosLosResultados([]);
          setResultadosError("No se pudo realizar la busqueda de jugadores.");
        }
      } finally {
        if (!cancelado) setIsLoadingResultados(false);
      }
    };

    buscarJugadores();
    return () => {
      cancelado = true;
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps -- pagina y orden
    // no van aca: se resuelven en memoria sobre todosLosResultados, no
    // ameritan volver a pedirle al backend.
  }, [selectedGameId, rankId, roleId, characterId, username]);

  // Cualquier cambio de filtro/juego vuelve a la pagina 1: si no, se podria
  // quedar en una pagina que ya no tiene sentido para el nuevo filtro (ej.
  // pagina 3 de "cualquiera" al filtrar por un rango que solo tiene 1 result).
  const setRankIdYVolverAPagina1 = (valor) => {
    setPagina(1);
    setRankId(valor);
  };

  const setRoleIdYVolverAPagina1 = (valor) => {
    setPagina(1);
    setRoleId(valor);
  };

  const setCharacterIdYVolverAPagina1 = (valor) => {
    setPagina(1);
    setCharacterId(valor);
  };

  const setUsernameYVolverAPagina1 = (valor) => {
    setPagina(1);
    setUsername(valor);
  };

  const limpiarFiltros = () => {
    setPagina(1);
    setRankId("");
    setRoleId("");
    setCharacterId("");
    setUsername("");
  };

  const selectGame = (gameId) => {
    setPagina(1);
    setSelectedGameId(gameId);
    limpiarFiltros();
  };

  const hayFiltrosOpcionales = Boolean(
    rankId || roleId || characterId || username.trim()
  );

  const resultadosOrdenados = useMemo(() => {
    if (!orden) return todosLosResultados;
    return [...todosLosResultados].sort(ORDENES[orden]);
  }, [todosLosResultados, orden]);

  const totalPaginas = Math.max(
    1,
    Math.ceil(resultadosOrdenados.length / RESULTADOS_POR_PAGINA)
  );

  const resultadosPagina = useMemo(() => {
    const inicio = (pagina - 1) * RESULTADOS_POR_PAGINA;
    return resultadosOrdenados.slice(inicio, inicio + RESULTADOS_POR_PAGINA);
  }, [resultadosOrdenados, pagina]);

  const paginaSiguiente = () => {
    setPagina((p) => Math.min(totalPaginas, p + 1));
  };

  const paginaAnterior = () => {
    setPagina((p) => Math.max(1, p - 1));
  };

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
    setRankId: setRankIdYVolverAPagina1,
    setRoleId: setRoleIdYVolverAPagina1,
    setCharacterId: setCharacterIdYVolverAPagina1,
    setUsername: setUsernameYVolverAPagina1,
    limpiarFiltros,
    hayFiltrosOpcionales,

    resultados: resultadosPagina,
    isLoadingResultados,
    resultadosError,

    orden,
    setOrden,

    pagina,
    totalPaginas,
    hayPaginaSiguiente: pagina < totalPaginas,
    hayPaginaAnterior: pagina > 1,
    paginaSiguiente,
    paginaAnterior,
  };
}

export default useBuscarJugadores;
