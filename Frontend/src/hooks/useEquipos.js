import { useCallback, useEffect, useMemo, useState } from "react";
import { getGames } from "../api/gameApi";
import { getRegionsByGame } from "../api/regionApi";
import { getRanksByGame } from "../api/rankApi";
import { getRolesByGame } from "../api/roleApi";
import {
  searchTeams,
  createTeam,
  joinTeam,
  getMyActiveTeam,
} from "../api/teamsApi";
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
  const { cargarConversaciones, abrirChat, abrirChatroom } = useChat();

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
        const nuevoEquipoGameId =
          nuevoEquipo.videogame?.videogame_id ?? nuevoEquipo.videogame_id;
        // Solo agregar si matchea el videojuego filtrado actual (o si no hay filtro de juego)
        if (
          !selectedGameId ||
          Number(nuevoEquipoGameId) === Number(selectedGameId)
        ) {
          setTeams((prev) => [
            nuevoEquipo,
            ...prev.filter(
              (t) => String(t.team_id) !== String(nuevoEquipo.team_id)
            ),
          ]);
        }
      } else if (event.type === EVENTO_TEAM_MEMBER_JOINED) {
        const equipoActualizado = event.data;
        setTeams((prev) =>
          prev.map((t) =>
            String(t.team_id) === String(equipoActualizado.team_id)
              ? equipoActualizado
              : t
          )
        );
      }
    },
    [selectedGameId]
  );

  useTeamsSocket(handleLobbyEvent);

  // Equipo activo obtenido del backend (/api/v1/teams/me)
  const [equipoActivoServidor, setEquipoActivoServidor] = useState(null);

  useEffect(() => {
    let cancelado = false;
    if (user) {
      getMyActiveTeam()
        .then((data) => {
          if (!cancelado) setEquipoActivoServidor(data ?? null);
        })
        .catch(() => {
          // Ignorar si no está autenticado o no tiene equipo
        });
    }
    return () => {
      cancelado = true;
    };
  }, [user]);

  // Verificar si el usuario actual ya pertenece a algún equipo activo
  const miEquipoActivo = useMemo(() => {
    if (!user) return null;
    if (equipoActivoServidor) return equipoActivoServidor;
    return (
      teams.find(
        (team) =>
          team.consultant_player_info?.is_member === true ||
          team.members?.some(
            (m) =>
              !m.is_vacant &&
              m.user_id !== null &&
              (m.user_id === user.user_id ||
                m.username === user.username ||
                m.name === user.name)
          )
      ) ?? null
    );
  }, [equipoActivoServidor, teams, user]);

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

      // Actualizar lista local de equipos y equipo activo evitando duplicados
      setTeams((prev) => [
        nuevoEquipo,
        ...prev.filter(
          (t) => String(t.team_id) !== String(nuevoEquipo.team_id)
        ),
      ]);
      setEquipoActivoServidor(nuevoEquipo);

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
  const solicitarUnirseAEquipo = async (
    team,
    targetSlotId,
    targetGameRoleId
  ) => {
    setActionError("");
    setSuccessNotification("");

    const vacanteSeleccionada = team.members?.find(
      (m) =>
        m.team_member_role_id === Number(targetSlotId) ||
        (m.is_vacant &&
          m.active_game_profile?.active_role_profile?.role_id ===
            Number(targetSlotId))
    );
    const roleIdParaValidar =
      targetGameRoleId ||
      vacanteSeleccionada?.active_game_profile?.active_role_profile?.role_id ||
      targetSlotId;

    const validacion = validarUnirseEquipo({
      team,
      user,
      targetRoleId: roleIdParaValidar,
      ranks,
      estaEnEquipoActivo,
    });

    if (!validacion.esValido) {
      setActionError(validacion.error);
      return { success: false, error: validacion.error };
    }

    try {
      const slotIdAEnviar =
        vacanteSeleccionada?.team_member_role_id ?? targetSlotId;
      const response = await joinTeam(team.team_id, slotIdAEnviar);
      const equipoActualizado = response.data || response;
      if (!equipoActualizado.conversation_id && response.chatroom_id) {
        equipoActualizado.conversation_id = response.chatroom_id;
      }

      // Actualizar equipo activo y estado local evitando duplicados
      setEquipoActivoServidor(equipoActualizado);
      setTeams((prev) =>
        prev.map((t) =>
          String(t.team_id) === String(equipoActualizado.team_id)
            ? equipoActualizado
            : t
        )
      );

      // Refrescar conversaciones de chat
      try {
        await cargarConversaciones();
      } catch (chatErr) {
        console.error("Error refrescando chat tras unirse:", chatErr);
      }

      const mensajeExito =
        response.message ||
        `¡Te has incorporado exitosamente al equipo "${team.team_name}"!`;
      setSuccessNotification(mensajeExito);

      return {
        success: true,
        team: equipoActualizado,
        chatroomId: response.chatroom_id,
        message: mensajeExito,
      };
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

  const abrirChatDeEquipo = useCallback(
    async (team) => {
      if (!team) return;
      try {
        abrirChat();
        const chatroomId = team.conversation_id;
        if (chatroomId) {
          abrirChatroom(chatroomId, team);
          return;
        }

        const lista = await cargarConversaciones();
        const convoEquipo = (lista ?? []).find(
          (c) =>
            c.chatroom_id === team.conversation_id ||
            c.team_id === team.team_id ||
            c.name?.toLowerCase().includes(team.team_name?.toLowerCase() ?? "")
        );
        if (convoEquipo) {
          abrirChatroom(convoEquipo.conversation_id, convoEquipo);
        }
      } catch (err) {
        console.error("Error al abrir chat de equipo:", err);
      }
    },
    [abrirChat, abrirChatroom, cargarConversaciones]
  );

  const teamsDeduplicados = useMemo(() => {
    const idsVistos = new Set();
    return teams.filter((team) => {
      if (!team || team.team_id === undefined || team.team_id === null)
        return false;
      const idStr = String(team.team_id);
      if (idsVistos.has(idStr)) return false;
      idsVistos.add(idStr);
      return true;
    });
  }, [teams]);

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
    teams: teamsDeduplicados,
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
