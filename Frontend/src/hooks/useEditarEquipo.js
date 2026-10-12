import { useState } from "react";
import { getRanksByGame } from "../api/rankApi";
import { getRegionsByGame } from "../api/regionApi";
import { actualizarEquipo } from "../api/teamApi";
import { logError } from "../utils/logs";
import { validarEdicionEquipo } from "../utils/validacionesEquipos";

// Los errores de rango del integrante y de catalogo de otro juego traen IDs
// internos; el resto (rango minimo > maximo, equipo sin region) ya viene
// legible y se usa tal cual.
function mensajeDeErrorAlEditar(error) {
  const data = error.response?.data;
  const status = error.response?.status;

  if (!error.response) {
    return "No pudimos conectar con el servidor. Intentá de nuevo.";
  }
  if (status === 403) return "Solo el líder del equipo puede modificarlo.";
  if (status === 404)
    return "El equipo o alguno de los datos elegidos ya no existe.";
  if (status === 409) return "El equipo ya no está activo.";
  if (status === 422) return "Hay datos del equipo que no son válidos.";
  if (typeof data?.error === "string") {
    if (/rango con ID .* no es válido/i.test(data.error)) {
      return "El nuevo rango tiene que incluir el rango de todos los integrantes.";
    }
    if (/no pertenece al videojuego/i.test(data.error)) {
      return "Alguno de los datos elegidos no corresponde al videojuego del equipo.";
    }
    return data.error;
  }
  if (typeof data?.detail === "string") return data.detail;

  return "Ocurrió un error al modificar el equipo. Intentá de nuevo.";
}

// Formulario precargado con los datos actuales del equipo
// (TeamSummaryResponse).
function formularioDesde(equipo) {
  return {
    nombre: equipo.team_name ?? "",
    descripcion: equipo.description ?? "",
    regionId: equipo.region?.region_id ? String(equipo.region.region_id) : "",
    admiteOtrasRegiones: Boolean(equipo.allow_other_regions),
    rangoMinimoId: equipo.min_rank?.rank_id
      ? String(equipo.min_rank.rank_id)
      : "",
    rangoMaximoId: equipo.max_rank?.rank_id
      ? String(equipo.max_rank.rank_id)
      : "",
  };
}

// US 15 - Modificar equipo. `abrir(equipo)` precarga el formulario y pide
// los rangos y regiones del videojuego del equipo (que no se puede cambiar);
// `guardar()` valida y envia. Devuelve la respuesta del backend
// ({ message, data }) o null si no paso la validacion o fallo.
const useEditarEquipo = () => {
  const [equipo, setEquipo] = useState(null);
  const [formulario, setFormulario] = useState(null);
  const [errores, setErrores] = useState({});

  const [rangos, setRangos] = useState([]);
  const [regiones, setRegiones] = useState([]);
  const [cargandoCatalogos, setCargandoCatalogos] = useState(false);
  const [errorCatalogos, setErrorCatalogos] = useState("");

  const [enviando, setEnviando] = useState(false);
  const [errorEnvio, setErrorEnvio] = useState("");

  const abrir = async (equipoAEditar) => {
    setEquipo(equipoAEditar);
    setFormulario(formularioDesde(equipoAEditar));
    setErrores({});
    setErrorEnvio("");
    setErrorCatalogos("");

    const videojuegoId = equipoAEditar.videogame?.videogame_id;
    if (!videojuegoId) return;

    try {
      setCargandoCatalogos(true);
      const [rangosJuego, regionesJuego] = await Promise.all([
        getRanksByGame(videojuegoId),
        getRegionsByGame(videojuegoId),
      ]);
      setRangos([...(rangosJuego ?? [])].sort((a, b) => a.value - b.value));
      setRegiones(regionesJuego ?? []);
    } catch (error) {
      logError("Error al cargar los rangos y regiones del equipo:", error);
      setErrorCatalogos(
        "No se pudieron cargar los rangos y regiones del videojuego."
      );
    } finally {
      setCargandoCatalogos(false);
    }
  };

  const cerrar = () => {
    setEquipo(null);
    setFormulario(null);
    setErrores({});
    setErrorEnvio("");
  };

  const actualizarCampo = (campo, valor) => {
    setFormulario((actual) => ({ ...actual, [campo]: valor }));
    // Los errores de rango y region cruzan campos: se limpian todos juntos.
    setErrores({});
    if (errorEnvio) setErrorEnvio("");
  };

  const buscarRango = (rangoId) =>
    rangos.find((rango) => String(rango.rank_id) === String(rangoId)) ?? null;

  const guardar = async () => {
    if (!equipo || !formulario) return null;

    const erroresValidacion = validarEdicionEquipo({
      ...formulario,
      rangoMinimo: buscarRango(formulario.rangoMinimoId),
      rangoMaximo: buscarRango(formulario.rangoMaximoId),
      integrantes: equipo.members,
      rangos,
    });

    setErrores(erroresValidacion);
    if (Object.keys(erroresValidacion).length > 0) return null;

    try {
      setEnviando(true);
      setErrorEnvio("");

      const resultado = await actualizarEquipo(equipo.team_id, formulario);
      cerrar();
      return resultado;
    } catch (error) {
      logError("Error al modificar el equipo:", error);
      setErrorEnvio(mensajeDeErrorAlEditar(error));
      return null;
    } finally {
      setEnviando(false);
    }
  };

  return {
    abierto: equipo !== null,
    equipo,
    formulario,
    errores,
    rangos,
    regiones,
    cargandoCatalogos,
    errorCatalogos,
    enviando,
    errorEnvio,
    abrir,
    cerrar,
    actualizarCampo,
    guardar,
  };
};

export default useEditarEquipo;
