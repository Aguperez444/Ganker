import { useCallback, useEffect, useMemo, useState } from "react";
import { getGames } from "../api/gameApi";
import { getRegionsByGame } from "../api/regionApi";
import { getRanksByGame } from "../api/rankApi";
import { getRolesByGame } from "../api/roleApi";
import { searchTeams, createTeam, joinTeam } from "../api/teamsApi";
import { useAuth } from "../context/AuthContext";
import { useChat } from "../context/ChatContext";
import useTeamsSocket, {
  EVENTO_TEAM_CREATED,
  EVENTO_TEAM_MEMBER_JOINED,
} from "./useTeamsSocket";
import {
  validarFormularioCrearEquipo,
  validarUnirseEquipo,
} from "../utils/validacionesEquipos";

export function useEquipos() {
  const { user } = useAuth();
  const { cargarConversaciones, seleccionarConversacion, abrirChat } =
    useChat();

  // Catálogos
  const [games, setGames] = useState([]);
  const [isLoadingGames, setIsLoadingGames] = useState(true);
  const [gamesError, setGamesError] = useState("");

  const [selectedGameId, setSelectedGameIdState] = useState("");
  const [regions, setRegions] = useState([]);
  const [ranks, setRanks] = useState([]);
  const [roles, setRoles] = useState([]);
  const [isLoadingGameCatalogs, setIsLoadingGameCatalogs] = useState(false);
  const [gameCatalogsError, setGameCatalogsError] = useState("");

  const [filterRegionId, setFilterRegionId] = useState("");
  const [filterRankId, setFilterRankId] = useState("");
  const [filterVacantSlots, setFilterVacantSlots] = useState("");
  const [filterRoleId, setFilterRoleId] = useState("");
  const [searchTerm, setSearchTerm] = useState("");
  const [searchTermDebounced, setSearchTermDebounced] = useState("");

  // Estado del Feed / Lista de Equipos
  const [teams, setTeams] = useState([]);
  const [isLoadingTeams, setIsLoadingTeams] = useState(false);
  const [teamsError, setTeamsError] = useState("");

  // Feedback general
  const [successNotification, setSuccessNotification] = useState("");
  const [actionError, setActionError] = useState("");

  // 1. Cargar videojuegos disponibles
  useEffect(() => {
    let cancelado = false;
    const cargarJuegos = async () => {
      try {
        setIsLoadingGames(true);
        setGamesError("");
        const data = await getGames();
        if (!cancelado) setGames(data ?? []);
      } catch (err) {
        console.error("Error al cargar videojuegos:", err);
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

  const setSelectedGameId = useCallback((gameId) => {
    setSelectedGameIdState(gameId);
    setRegions([]);
    setRanks([]);
    setRoles([]);
    setFilterRegionId("");
    setFilterRankId("");
    setFilterRoleId("");
  }, []);

  // 2. Cargar regiones, rangos y roles al seleccionar o cambiar videojuego
  useEffect(() => {
    if (!selectedGameId) return;

    let cancelado = false;

    const cargarCatalogos = async () => {
      try {
        setIsLoadingGameCatalogs(true);
        setGameCatalogsError("");

        const [regionesData, rangosData, rolesData] = await Promise.all([
          getRegionsByGame(selectedGameId).catch(() => []),
          getRanksByGame(selectedGameId).catch(() => []),
          getRolesByGame(selectedGameId).catch(() => []),
        ]);

        if (cancelado) return;
        setRegions(regionesData ?? []);
        setRanks(rangosData ?? []);
        setRoles(rolesData ?? []);
      } catch (err) {
        console.error("Error al cargar datos del videojuego:", err);
        if (!cancelado) {
          setGameCatalogsError(
            "No se pudieron cargar las regiones, rangos y roles del videojuego."
          );
        }
      } finally {
        if (!cancelado) setIsLoadingGameCatalogs(false);
      }
    };

    cargarCatalogos();
    return () => {
      cancelado = true;
    };
  }, [selectedGameId]);

  // Debounce para búsqueda por texto
  useEffect(() => {
    const handler = setTimeout(() => {
      setSearchTermDebounced(searchTerm);
    }, 350);
    return () => clearTimeout(handler);
  }, [searchTerm]);

  // 3. Buscar equipos en el backend
  useEffect(() => {
    let cancelado = false;

    const buscar = async () => {
      try {
        setIsLoadingTeams(true);
        setTeamsError("");

        const filters = {
          videogame_id: selectedGameId || undefined,
          region_id: filterRegionId || undefined,
          rank_id: filterRankId || undefined,
          vacant_slots: filterVacantSlots || undefined,
          role_id: filterRoleId || undefined,
          search: searchTermDebounced || undefined,
        };

        const data = await searchTeams(filters);
        if (!cancelado) setTeams(data ?? []);
      } catch (err) {
        console.error("Error al buscar equipos:", err);
        if (!cancelado) {
          setTeams([]);
          setTeamsError("No se pudieron cargar los equipos disponibles.");
        }
      } finally {
        if (!cancelado) setIsLoadingTeams(false);
      }
    };

    buscar();
    return () => {
      cancelado = true;
    };
  }, [
    selectedGameId,
    filterRegionId,
    filterRankId,
    filterVacantSlots,
    filterRoleId,
    searchTermDebounced,
  ]);

  const fetchTeams = useCallback(async () => {
    try {
      setIsLoadingTeams(true);
      setTeamsError("");

      const filters = {
        videogame_id: selectedGameId || undefined,
        region_id: filterRegionId || undefined,
        rank_id: filterRankId || undefined,
        vacant_slots: filterVacantSlots || undefined,
        role_id: filterRoleId || undefined,
        search: searchTermDebounced || undefined,
      };

      const data = await searchTeams(filters);
      setTeams(data ?? []);
    } catch (err) {
      console.error("Error al buscar equipos:", err);
      setTeams([]);
      setTeamsError("No se pudieron cargar los equipos disponibles.");
    } finally {
      setIsLoadingTeams(false);
    }
  }, [
    selectedGameId,
    filterRegionId,
    filterRankId,
    filterVacantSlots,
    filterRoleId,
    searchTermDebounced,
  ]);

  // 4. WebSocket para eventos del Lobby en tiempo real
  const handleLobbyEvent = useCallback(
    (event) => {
      if (!event?.type || !event?.data) return;

      if (event.type === EVENTO_TEAM_CREATED) {
        const nuevoEquipo = event.data;
        // Solo agregar si matchea el videojuego filtrado actual (o si no hay filtro de juego)
        if (
          !selectedGameId ||
          Number(nuevoEquipo.videogame_id) === Number(selectedGameId)
        ) {
          setTeams((prev) => [
            nuevoEquipo,
            ...prev.filter((t) => t.team_id !== nuevoEquipo.team_id),
          ]);
        }
      } else if (event.type === EVENTO_TEAM_MEMBER_JOINED) {
        const equipoActualizado = event.data;
        setTeams((prev) =>
          prev.map((t) =>
            t.team_id === equipoActualizado.team_id ? equipoActualizado : t
          )
        );
      }
    },
    [selectedGameId]
  );

  useTeamsSocket(handleLobbyEvent);

  // Verificar si el usuario actual ya pertenece a algún equipo activo
  const miEquipoActivo = useMemo(() => {
    if (!user) return null;
    return (
      teams.find((team) =>
        team.members?.some(
          (m) =>
            m.user_id !== null &&
            (m.username === user.username || m.name === user.name)
        )
      ) ?? null
    );
  }, [teams, user]);

  const estaEnEquipoActivo = Boolean(miEquipoActivo);

  // Limpiar todos los filtros opcionales
  const limpiarFiltros = useCallback(() => {
    setSelectedGameId("");
    setFilterRegionId("");
    setFilterRankId("");
    setFilterVacantSlots("");
    setFilterRoleId("");
    setSearchTerm("");
    setSearchTermDebounced("");
  }, [setSelectedGameId]);

  const hayFiltrosActivos = Boolean(
    selectedGameId ||
    filterRegionId ||
    filterRankId ||
    filterVacantSlots ||
    filterRoleId ||
    searchTerm.trim()
  );

  // Crear equipo
  const registrarEquipo = async (formData) => {
    setActionError("");
    setSuccessNotification("");

    const validacion = validarFormularioCrearEquipo({
      ...formData,
      ranks,
      user,
      estaEnEquipoActivo,
    });

    if (!validacion.esValido) {
      return { success: false, errores: validacion.errores };
    }

    try {
      const nuevoEquipo = await createTeam(formData);

      // Actualizar lista local de equipos
      setTeams((prev) => [nuevoEquipo, ...prev]);

      // Refrescar conversaciones del chat para habilitar la nueva sala grupal
      try {
        await cargarConversaciones();
      } catch (chatErr) {
        console.error("Error refrescando chat tras crear equipo:", chatErr);
      }

      setSuccessNotification(
        `¡Equipo "${nuevoEquipo.team_name}" creado con éxito! Ya eres líder de tu sala de equipo.`
      );

      return { success: true, team: nuevoEquipo };
    } catch (err) {
      console.error("Error al registrar equipo:", err);
      const backendError =
        err.response?.data?.error ||
        err.response?.data?.detail ||
        "No se pudo registrar el equipo. Verifica los datos ingresados.";

      setActionError(backendError);
      return {
        success: false,
        errores: { general: backendError },
      };
    }
  };

  // Unirse a un equipo
  const solicitarUnirseAEquipo = async (team, targetRoleId) => {
    setActionError("");
    setSuccessNotification("");

    const validacion = validarUnirseEquipo({
      team,
      user,
      targetRoleId,
      ranks,
      estaEnEquipoActivo,
    });

    if (!validacion.esValido) {
      setActionError(validacion.error);
      return { success: false, error: validacion.error };
    }

    try {
      const response = await joinTeam(team.team_id, targetRoleId);
      const equipoActualizado = response.data || response;

      // Actualizar equipo en la lista local
      setTeams((prev) =>
        prev.map((t) =>
          t.team_id === equipoActualizado.team_id ? equipoActualizado : t
        )
      );

      // Refrescar conversaciones de chat
      try {
        await cargarConversaciones();
      } catch (chatErr) {
        console.error("Error refrescando chat tras unirse:", chatErr);
      }

      setSuccessNotification(
        `¡Te has incorporado exitosamente al equipo "${team.team_name}"!`
      );

      return { success: true, team: equipoActualizado };
    } catch (err) {
      console.error("Error al unirse al equipo:", err);
      let mensaje = "No se pudo unir al equipo.";
      const detail = err.response?.data?.error || err.response?.data?.detail;

      if (detail) {
        if (detail.includes("InvalidRegion") || detail.includes("region")) {
          mensaje =
            "Región incompatible: El equipo no admite miembros de otras regiones.";
        } else if (detail.includes("Invalidrank") || detail.includes("rank")) {
          mensaje =
            "Tu rango no se encuentra comprendido dentro de los límites exigidos por el equipo.";
        } else if (
          detail.includes("RoleAlreadyOcupied") ||
          detail.includes("ocupied")
        ) {
          mensaje = "Este cupo acaba de ser ocupado por otro jugador.";
        } else if (
          detail.includes("UserAlreadyInTeam") ||
          detail.includes("active")
        ) {
          mensaje = "Ya formas parte activa de otro equipo en este momento.";
        } else {
          mensaje = detail;
        }
      }

      setActionError(mensaje);
      return { success: false, error: mensaje };
    }
  };

  const abrirChatDeEquipo = async (team) => {
    try {
      const lista = await cargarConversaciones();
      const convoEquipo = (lista ?? []).find(
        (c) =>
          c.name?.toLowerCase().includes(team.team_name.toLowerCase()) ||
          c.name?.toLowerCase().includes("equipo")
      );

      if (convoEquipo) {
        seleccionarConversacion(convoEquipo.conversation_id);
      } else {
        abrirChat();
      }
    } catch {
      abrirChat();
    }
  };

  return {
    // Catálogos
    games,
    isLoadingGames,
    gamesError,
    selectedGameId,
    setSelectedGameId,
    regions,
    ranks,
    roles,
    isLoadingGameCatalogs,
    gameCatalogsError,

    // Filtros
    filterRegionId,
    setFilterRegionId,
    filterRankId,
    setFilterRankId,
    filterVacantSlots,
    setFilterVacantSlots,
    filterRoleId,
    setFilterRoleId,
    searchTerm,
    setSearchTerm,
    limpiarFiltros,
    hayFiltrosActivos,

    // Lista de Equipos
    teams,
    isLoadingTeams,
    teamsError,
    fetchTeams,

    // Estado usuario
    user,
    miEquipoActivo,
    estaEnEquipoActivo,

    // Acciones
    registrarEquipo,
    solicitarUnirseAEquipo,
    abrirChatDeEquipo,

    // Notificaciones y errores
    successNotification,
    setSuccessNotification,
    actionError,
    setActionError,
  };
}

export default useEquipos;
