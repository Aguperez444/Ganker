import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import { getRanksByGame } from "../api/rankApi";
import { getRegionsByGame } from "../api/regionApi";
import { getRolesByGame } from "../api/roleApi";
import { crearEquipo, obtenerMiEquipo } from "../api/teamApi";
import { useAuth } from "../context/AuthContext";
import { validarFormularioEquipo } from "../utils/validacionesEquipos";

// Funcion de modulo (no useCallback del hook) por el mismo motivo que
// cargarVideojuegos en useGames.js: llamarla desde un efecto no dispara la
// regla set-state-in-effect.
async function consultarMiEquipo({ setMiEquipo, setVerificandoEquipo }) {
  try {
    setMiEquipo(await obtenerMiEquipo());
  } catch (error) {
    // Si la consulta falla no bloqueamos el formulario: el backend vuelve a
    // validar al crear y responde 409 si el jugador ya tiene equipo.
    console.error("Error al consultar el equipo del jugador:", error);
    setMiEquipo(null);
  } finally {
    setVerificandoEquipo(false);
  }
}

// Mensaje del backend ({ error } de las excepciones de dominio o { detail }
// de FastAPI), con un texto propio por status cuando no viene uno legible.
function mensajeDeErrorAlCrear(error) {
  const data = error.response?.data;
  const status = error.response?.status;

  if (status === 409) {
    return "Ya formás parte de un equipo activo. Tenés que salir de él para crear otro.";
  }
  if (typeof data?.error === "string") return data.error;
  if (typeof data?.detail === "string") return data.detail;
  if (status === 422) return "Hay datos del equipo que no son válidos.";
  if (status === 404) {
    return "Alguno de los datos elegidos ya no existe. Recargá la página e intentá de nuevo.";
  }

  return "Ocurrió un error al crear el equipo. Intentá de nuevo.";
}

const CAMPOS_DE_RANGO = ["rangoMinimo", "rangoMaximo", "rolCreador"];

const FORMULARIO_INICIAL = {
  nombre: "",
  descripcion: "",
  videojuegoId: "",
  regionId: "",
  admiteOtrasRegiones: false,
  rangoMinimoId: "",
  rangoMaximoId: "",
  rolCreadorId: "",
  rolesVacantesIds: [""],
};

// US 14 - Crear equipo.
// Solo se ofrecen los videojuegos en los que el jugador tiene perfil: el
// backend necesita su perfil de rol (rol + rango) para sumarlo como lider.
const useCrearEquipo = () => {
  const { user } = useAuth();
  const perfiles = useMemo(() => user?.profiles ?? [], [user]);

  const [formulario, setFormulario] = useState(FORMULARIO_INICIAL);
  const [errores, setErrores] = useState({});

  const [rangos, setRangos] = useState([]);
  const [roles, setRoles] = useState([]);
  const [regiones, setRegiones] = useState([]);
  const [cargandoCatalogos, setCargandoCatalogos] = useState(false);
  const [errorCatalogos, setErrorCatalogos] = useState("");

  const [miEquipo, setMiEquipo] = useState(null);
  const [verificandoEquipo, setVerificandoEquipo] = useState(true);

  const [enviando, setEnviando] = useState(false);
  const [errorEnvio, setErrorEnvio] = useState("");

  // Si el jugador cambia de juego rapido, solo vale la respuesta del ultimo.
  const juegoPedidoRef = useRef("");

  useEffect(() => {
    consultarMiEquipo({ setMiEquipo, setVerificandoEquipo });
  }, []);

  const perfilSeleccionado = useMemo(
    () =>
      perfiles.find(
        (perfil) =>
          String(perfil.videogame.id) === String(formulario.videojuegoId)
      ) ?? null,
    [perfiles, formulario.videojuegoId]
  );

  // Roles en los que el jugador tiene perfil de rol: son los unicos con los
  // que puede entrar al equipo, y cada uno trae su rango.
  const rolesDelJugador = perfilSeleccionado?.role_profiles ?? [];

  const buscarRango = (rangoId) =>
    rangos.find((rango) => String(rango.rank_id) === String(rangoId)) ?? null;

  const rangoJugador =
    rolesDelJugador.find(
      (perfilRol) =>
        String(perfilRol.role.role_id) === String(formulario.rolCreadorId)
    )?.rank ?? null;

  const limpiarError = (campo) => {
    // Los errores de rango cruzan campos (min > max se muestra en el maximo,
    // el rango del creador en su rol): corregir cualquiera de los tres puede
    // resolverlos, asi que se limpian juntos.
    const campos = CAMPOS_DE_RANGO.includes(campo) ? CAMPOS_DE_RANGO : [campo];

    if (campos.some((c) => errores[c])) {
      setErrores((actuales) => {
        const siguientes = { ...actuales };
        campos.forEach((c) => delete siguientes[c]);
        return siguientes;
      });
    }
    if (errorEnvio) setErrorEnvio("");
  };

  const actualizarCampo = (campo, valor, campoDeError = campo) => {
    setFormulario((actual) => ({ ...actual, [campo]: valor }));
    limpiarError(campoDeError);
  };

  const seleccionarVideojuego = useCallback(
    async (videojuegoId) => {
      const perfil = perfiles.find(
        (p) => String(p.videogame.id) === String(videojuegoId)
      );

      // Rangos, roles y region dependen del juego: lo elegido para otro juego
      // ya no vale. La region arranca en la del perfil del jugador.
      setFormulario((actual) => ({
        ...FORMULARIO_INICIAL,
        nombre: actual.nombre,
        descripcion: actual.descripcion,
        videojuegoId,
        regionId: perfil?.region?.region_id
          ? String(perfil.region.region_id)
          : "",
        rolesVacantesIds: actual.rolesVacantesIds.map(() => ""),
      }));
      setErrores({});
      setErrorEnvio("");
      setRangos([]);
      setRoles([]);
      setRegiones([]);
      setErrorCatalogos("");

      juegoPedidoRef.current = videojuegoId;
      if (!videojuegoId) return;

      try {
        setCargandoCatalogos(true);

        const [rangosJuego, rolesJuego, regionesJuego] = await Promise.all([
          getRanksByGame(videojuegoId),
          getRolesByGame(videojuegoId),
          getRegionsByGame(videojuegoId),
        ]);

        if (juegoPedidoRef.current !== videojuegoId) return;

        setRangos([...(rangosJuego || [])].sort((a, b) => a.value - b.value));
        setRoles(rolesJuego || []);
        setRegiones(regionesJuego || []);
      } catch (error) {
        console.error("Error al cargar los datos del videojuego:", error);
        if (juegoPedidoRef.current === videojuegoId) {
          setErrorCatalogos(
            "No se pudieron cargar los rangos, roles y regiones del videojuego."
          );
        }
      } finally {
        if (juegoPedidoRef.current === videojuegoId) {
          setCargandoCatalogos(false);
        }
      }
    },
    [perfiles]
  );

  const cambiarCantidadVacantes = (cantidad) => {
    setFormulario((actual) => {
      const rolesVacantesIds = Array.from(
        { length: cantidad },
        (_, indice) => actual.rolesVacantesIds[indice] ?? ""
      );
      return { ...actual, rolesVacantesIds };
    });
    limpiarError("rolesVacantes");
  };

  const cambiarRolVacante = (indice, rolId) => {
    setFormulario((actual) => ({
      ...actual,
      rolesVacantesIds: actual.rolesVacantesIds.map((actualId, i) =>
        i === indice ? rolId : actualId
      ),
    }));
    limpiarError("rolesVacantes");
  };

  // Devuelve el equipo creado, o null si no paso la validacion o fallo.
  const enviar = async () => {
    const erroresValidacion = validarFormularioEquipo({
      ...formulario,
      rangoMinimo: buscarRango(formulario.rangoMinimoId),
      rangoMaximo: buscarRango(formulario.rangoMaximoId),
      rangoJugador,
      regionJugador: perfilSeleccionado?.region ?? null,
    });

    setErrores(erroresValidacion);
    if (Object.keys(erroresValidacion).length > 0) return null;

    try {
      setEnviando(true);
      setErrorEnvio("");

      return await crearEquipo(formulario);
    } catch (error) {
      console.error("Error al crear el equipo:", error);
      setErrorEnvio(mensajeDeErrorAlCrear(error));
      return null;
    } finally {
      setEnviando(false);
    }
  };

  return {
    perfiles,
    formulario,
    errores,

    rangos,
    roles,
    regiones,
    rolesDelJugador,
    cargandoCatalogos,
    errorCatalogos,

    miEquipo,
    verificandoEquipo,

    enviando,
    errorEnvio,

    actualizarCampo,
    seleccionarVideojuego,
    cambiarCantidadVacantes,
    cambiarRolVacante,
    enviar,
  };
};

export default useCrearEquipo;
