import { useEffect, useState } from "react";
import { getGames } from "../api/gameApi";
import { getRanksByGame } from "../api/rankApi";
import { getRegionsByGame } from "../api/regionApi";
import { getRolesByGame } from "../api/roleApi";
import { buscarEquipos } from "../api/teamApi";
import { useAuth } from "../context/AuthContext";
import { logError } from "../utils/logs";

export const EQUIPOS_POR_PAGINA = 10;

// El backend devuelve tambien equipos llenos si no se le pide un minimo de
// vacantes, y la US pide listar solo los que tienen cupo: por eso el filtro
// arranca (y vuelve al limpiar) en "al menos 1".
export const VACANTES_MINIMAS_POR_DEFECTO = "1";
export const OPCIONES_VACANTES_MINIMAS = ["1", "2", "3", "4"];

const FILTROS_INICIALES = {
  regionId: "",
  rangoId: "",
  rolId: "",
  vacantesMinimas: VACANTES_MINIMAS_POR_DEFECTO,
  texto: "",
};

// US 17 - Buscar equipos.
// Mismo esquema que useBuscarJugadores: el videojuego es obligatorio (el
// backend lo exige) y de el dependen region, rango y rol. Arranca en el
// juego del primer perfil del jugador, que es donde puede unirse.
const useBuscarEquipos = () => {
  const { user } = useAuth();
  const juegoInicial = user?.profiles?.[0]?.videogame?.id;

  const [videojuegos, setVideojuegos] = useState([]);
  const [cargandoVideojuegos, setCargandoVideojuegos] = useState(true);
  const [errorVideojuegos, setErrorVideojuegos] = useState("");

  const [videojuegoId, setVideojuegoId] = useState(
    juegoInicial ? String(juegoInicial) : ""
  );
  const [regiones, setRegiones] = useState([]);
  const [rangos, setRangos] = useState([]);
  const [roles, setRoles] = useState([]);
  const [cargandoCatalogos, setCargandoCatalogos] = useState(false);
  const [errorCatalogos, setErrorCatalogos] = useState("");

  const [filtros, setFiltros] = useState(FILTROS_INICIALES);
  const [textoDebounced, setTextoDebounced] = useState("");
  const [pagina, setPagina] = useState(1);

  const [equipos, setEquipos] = useState([]);
  const [cargandoEquipos, setCargandoEquipos] = useState(false);
  const [errorEquipos, setErrorEquipos] = useState("");

  useEffect(() => {
    let cancelado = false;

    const cargarVideojuegos = async () => {
      try {
        setCargandoVideojuegos(true);
        setErrorVideojuegos("");
        const lista = await getGames();
        if (!cancelado) setVideojuegos(lista ?? []);
      } catch (error) {
        logError("Error al cargar videojuegos:", error);
        if (!cancelado) {
          setErrorVideojuegos(
            "No se pudieron cargar los videojuegos disponibles."
          );
        }
      } finally {
        if (!cancelado) setCargandoVideojuegos(false);
      }
    };

    cargarVideojuegos();
    return () => {
      cancelado = true;
    };
  }, []);

  useEffect(() => {
    const timeoutId = setTimeout(() => setTextoDebounced(filtros.texto), 350);
    return () => clearTimeout(timeoutId);
  }, [filtros.texto]);

  useEffect(() => {
    let cancelado = false;

    const cargarCatalogos = async () => {
      if (!videojuegoId) {
        setRegiones([]);
        setRangos([]);
        setRoles([]);
        return;
      }

      try {
        setCargandoCatalogos(true);
        setErrorCatalogos("");

        const [regionesJuego, rangosJuego, rolesJuego] = await Promise.all([
          getRegionsByGame(videojuegoId),
          getRanksByGame(videojuegoId),
          getRolesByGame(videojuegoId),
        ]);

        if (cancelado) return;
        setRegiones(regionesJuego ?? []);
        setRangos([...(rangosJuego ?? [])].sort((a, b) => a.value - b.value));
        setRoles(rolesJuego ?? []);
      } catch (error) {
        logError("Error al cargar los datos del videojuego:", error);
        if (!cancelado) {
          setRegiones([]);
          setRangos([]);
          setRoles([]);
          setErrorCatalogos(
            "No se pudieron cargar las regiones, rangos y roles de este videojuego."
          );
        }
      } finally {
        if (!cancelado) setCargandoCatalogos(false);
      }
    };

    cargarCatalogos();
    return () => {
      cancelado = true;
    };
  }, [videojuegoId]);

  useEffect(() => {
    let cancelado = false;

    const buscar = async () => {
      if (!videojuegoId) {
        setEquipos([]);
        return;
      }

      try {
        setCargandoEquipos(true);
        setErrorEquipos("");

        const resultado = await buscarEquipos({
          videojuegoId,
          regionId: filtros.regionId,
          rangoId: filtros.rangoId,
          rolId: filtros.rolId,
          vacantesMinimas: filtros.vacantesMinimas,
          texto: textoDebounced.trim(),
          pagina,
          tamanio: EQUIPOS_POR_PAGINA,
        });

        if (!cancelado) setEquipos(resultado ?? []);
      } catch (error) {
        logError("Error al buscar equipos:", error);
        if (!cancelado) {
          setEquipos([]);
          setErrorEquipos("No se pudo realizar la búsqueda de equipos.");
        }
      } finally {
        if (!cancelado) setCargandoEquipos(false);
      }
    };

    buscar();
    return () => {
      cancelado = true;
    };
  }, [
    videojuegoId,
    filtros.regionId,
    filtros.rangoId,
    filtros.rolId,
    filtros.vacantesMinimas,
    textoDebounced,
    pagina,
  ]);

  // Cualquier cambio de filtro vuelve a la pagina 1 (mismo criterio que
  // Buscar jugadores).
  const cambiarFiltro = (campo, valor) => {
    setPagina(1);
    setFiltros((actuales) => ({ ...actuales, [campo]: valor }));
  };

  const limpiarFiltros = () => {
    setPagina(1);
    setFiltros(FILTROS_INICIALES);
    setTextoDebounced("");
  };

  // Region, rango y rol son del juego: al cambiarlo dejan de valer.
  const seleccionarVideojuego = (id) => {
    setVideojuegoId(id ? String(id) : "");
    limpiarFiltros();
  };

  const hayFiltrosOpcionales = Boolean(
    filtros.regionId ||
    filtros.rangoId ||
    filtros.rolId ||
    filtros.texto.trim() ||
    filtros.vacantesMinimas !== VACANTES_MINIMAS_POR_DEFECTO
  );

  // Reemplaza un equipo de la lista por su estado actual; si ya no tiene
  // vacantes deja de cumplir la busqueda y se saca.
  const actualizarEquipo = (equipoActualizado) => {
    setEquipos((actuales) =>
      actuales
        .map((e) =>
          e.team_id === equipoActualizado.team_id ? equipoActualizado : e
        )
        .filter(
          (e) =>
            e.team_id !== equipoActualizado.team_id ||
            e.player_count < e.max_players
        )
    );
  };

  // El backend no devuelve el total de resultados, asi que la paginacion es
  // "hay siguiente si la pagina vino completa".
  const hayPaginaSiguiente = equipos.length === EQUIPOS_POR_PAGINA;

  return {
    videojuegos,
    cargandoVideojuegos,
    errorVideojuegos,
    videojuegoId,
    seleccionarVideojuego,

    regiones,
    rangos,
    roles,
    cargandoCatalogos,
    errorCatalogos,

    filtros,
    cambiarFiltro,
    limpiarFiltros,
    hayFiltrosOpcionales,

    equipos,
    cargandoEquipos,
    errorEquipos,
    actualizarEquipo,

    pagina,
    hayPaginaAnterior: pagina > 1,
    hayPaginaSiguiente,
    paginaAnterior: () => setPagina((p) => Math.max(1, p - 1)),
    paginaSiguiente: () => {
      if (hayPaginaSiguiente) setPagina((p) => p + 1);
    },
  };
};

export default useBuscarEquipos;
