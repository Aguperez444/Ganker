import { useCallback, useEffect, useMemo, useState } from "react";
import { getGames } from "../api/gameApi";
import { getRegionsByGame } from "../api/regionApi";
import { getRanksByGame } from "../api/rankApi";
import { getRolesByGame } from "../api/roleApi";
import { buscarEquipos, unirseAEquipo } from "../api/teamApi";
import { mensajeDeError } from "../utils/errores";

// El backend pagina por page/size y devuelve una lista plana (sin total de
// páginas): no se sabe cuántas páginas quedan hasta llegar a una que venga
// incompleta. Por eso el hook ofrece "Cargar más" (append de la página
// siguiente) en vez de paginación numerada.
const RESULTADOS_POR_PAGINA = 20;

// Función de módulo (no del componente, ver el comentario equivalente en
// hooks/useGames.js): carga una página de la búsqueda. `append` decide si
// reemplaza el listado (filtros nuevos, página 1) o lo agrega al final
// (botón "Cargar más"). `control.cancelado` la vuelve un no-op si el efecto
// que la llamó ya se limpió.
async function cargarPaginaDeEquipos(
  {
    control,
    append = false,
    setEquipos,
    setHayMas,
    setPagina,
    setIsLoading,
    setError,
  },
  filtros
) {
  try {
    setIsLoading(true);
    setError("");

    const resultados = (await buscarEquipos(filtros)) ?? [];
    if (control && control.cancelado) return;

    setEquipos((previos) =>
      append ? [...previos, ...resultados] : resultados
    );
    setPagina(filtros.page);
    setHayMas(resultados.length >= RESULTADOS_POR_PAGINA);
  } catch (error) {
    console.error("Error al buscar equipos:", error);
    if (!control || !control.cancelado) {
      setError("No se pudo realizar la búsqueda de equipos.");
    }
  } finally {
    if (!control || !control.cancelado) setIsLoading(false);
  }
}

export function useBuscarEquipos() {
  // Catálogo de videojuegos (depende del que consulta: la búsqueda de equipos
  // requiere elegir el videojuego primero, igual que Buscar jugadores).
  const [games, setGames] = useState([]);
  const [isLoadingGames, setIsLoadingGames] = useState(true);
  const [gamesError, setGamesError] = useState("");

  const [selectedGameId, setSelectedGameId] = useState("");

  // Catálogos del videojuego elegido (regiones, rangos y roles del filtro).
  const [regions, setRegions] = useState([]);
  const [ranks, setRanks] = useState([]);
  const [roles, setRoles] = useState([]);
  const [isLoadingGameData, setIsLoadingGameData] = useState(false);
  const [gameDataError, setGameDataError] = useState("");

  // Filtros opcionales.
  const [regionId, setRegionId] = useState("");
  const [rankId, setRankId] = useState("");
  const [vacantSlots, setVacantSlots] = useState("");
  const [roleId, setRoleId] = useState("");
  const [search, setSearch] = useState("");
  const [searchDebounced, setSearchDebounced] = useState("");

  // Resultados (paginación por anexión).
  const [equipos, setEquipos] = useState([]);
  const [pagina, setPagina] = useState(1);
  const [hayMas, setHayMas] = useState(false);
  const [isLoadingResultados, setIsLoadingResultados] = useState(false);
  const [isCargandoMas, setIsCargandoMas] = useState(false);
  const [resultadosError, setResultadosError] = useState("");

  // Unirse a un equipo.
  const [equipoUniendoseId, setEquipoUniendoseId] = useState(null);
  const [recargaToken, setRecargaToken] = useState(0);

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
        setRegions([]);
        setRanks([]);
        setRoles([]);
        return;
      }

      try {
        setIsLoadingGameData(true);
        setGameDataError("");

        const [gameRegions, gameRanks, gameRoles] = await Promise.all([
          getRegionsByGame(selectedGameId),
          getRanksByGame(selectedGameId),
          getRolesByGame(selectedGameId),
        ]);

        if (cancelado) return;
        setRegions(gameRegions ?? []);
        setRanks(gameRanks ?? []);
        setRoles(gameRoles ?? []);
      } catch (error) {
        console.error("Error al cargar los datos del videojuego:", error);
        if (!cancelado) {
          setRegions([]);
          setRanks([]);
          setRoles([]);
          setGameDataError(
            "No se pudieron cargar las regiones, rangos y roles de este videojuego."
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

  // Debounce del texto de búsqueda (mismo criterio que useBuscarJugadores).
  useEffect(() => {
    const timeoutId = setTimeout(() => {
      setSearchDebounced(search);
    }, 350);

    return () => clearTimeout(timeoutId);
  }, [search]);

  const filtros = useMemo(
    () => ({
      videogame_id: selectedGameId ? Number(selectedGameId) : undefined,
      region_id: regionId ? Number(regionId) : undefined,
      rank_id: rankId ? Number(rankId) : undefined,
      vacant_slots: vacantSlots ? Number(vacantSlots) : undefined,
      role_id: roleId ? Number(roleId) : undefined,
      search: searchDebounced.trim() || undefined,
    }),
    [selectedGameId, regionId, rankId, vacantSlots, roleId, searchDebounced]
  );

  // Cualquier cambio de filtro/juego vuelve a la página 1.
  useEffect(() => {
    const control = { cancelado: false };

    const buscar = async () => {
      if (!filtros.videogame_id) {
        setEquipos([]);
        setHayMas(false);
        setPagina(1);
        setResultadosError("");
        return;
      }

      await cargarPaginaDeEquipos(
        {
          control,
          setEquipos,
          setHayMas,
          setPagina,
          setIsLoading: setIsLoadingResultados,
          setError: setResultadosError,
        },
        { ...filtros, page: 1, size: RESULTADOS_POR_PAGINA }
      );
    };

    buscar();
    return () => {
      control.cancelado = true;
    };
    // recargaToken solo marca "volvé a buscar" (tras unirse a un equipo) sin
    // tocar los filtros; ya está declarado arriba y no se usa dentro del
    // cuerpo del efecto a propósito.
  }, [filtros, recargaToken]);

  const cargarMas = async () => {
    if (isCargandoMas) return;

    try {
      setIsCargandoMas(true);
      setResultadosError("");

      const siguiente = pagina + 1;
      const resultados = (await buscarEquipos({
        ...filtros,
        page: siguiente,
        size: RESULTADOS_POR_PAGINA,
      })) ?? [];

      setPagina(siguiente);
      setEquipos((previos) => [...previos, ...resultados]);
      setHayMas(resultados.length >= RESULTADOS_POR_PAGINA);
    } catch (error) {
      console.error("Error al cargar más equipos:", error);
      setResultadosError("No se pudieron cargar más equipos.");
    } finally {
      setIsCargandoMas(false);
    }
  };

  const selectGame = (gameId) => {
    setSelectedGameId(gameId);
    limpiarFiltros();
  };

  const limpiarFiltros = () => {
    setRegionId("");
    setRankId("");
    setVacantSlots("");
    setRoleId("");
    setSearch("");
  };

  const hayFiltrosOpcionales = Boolean(
    regionId || rankId || vacantSlots || roleId || search.trim()
  );

  // Une al jugador a la vacante elegida. Al éxito, dispara una nueva búsqueda
  // (recargaToken) para que el listado refleje el nuevo estado (el equipo al
  // que se unió pasa a mostrarlo como miembro y los demás como "ya pertenece
  // a otro equipo activo").
  const unirse = async (equipo, vacante) => {
    setEquipoUniendoseId(equipo.team_id);

    try {
      const respuesta = await unirseAEquipo(
        equipo.team_id,
        vacante.team_member_role_id
      );
      setRecargaToken((token) => token + 1);
      return { ok: true, mensaje: respuesta.message };
    } catch (error) {
      console.error("Error al unirse al equipo:", error);
      return {
        ok: false,
        mensaje: mensajeDeError(error, "No se pudo unir al equipo."),
      };
    } finally {
      setEquipoUniendoseId(null);
    }
  };

  // Fuerza una nueva búsqueda sin tocar los filtros (por ejemplo, después de
  // unirse a un equipo o de recibir un evento del feed en vivo).
  const recargar = useCallback(() => {
    setRecargaToken((token) => token + 1);
  }, []);

  return {
    games,
    isLoadingGames,
    gamesError,

    selectedGameId,
    selectGame,

    regions,
    ranks,
    roles,
    isLoadingGameData,
    gameDataError,

    regionId,
    setRegionId,
    rankId,
    setRankId,
    vacantSlots,
    setVacantSlots,
    roleId,
    setRoleId,
    search,
    setSearch,
    limpiarFiltros,
    hayFiltrosOpcionales,

    equipos,
    isLoadingResultados,
    isCargandoMas,
    resultadosError,
    hayMas,
    cargarMas,

    unirse,
    procesandoUnirse: equipoUniendoseId,
    recargar,
  };
}

export default useBuscarEquipos;