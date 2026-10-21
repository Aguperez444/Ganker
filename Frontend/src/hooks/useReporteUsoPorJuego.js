import { useCallback, useEffect, useState } from "react";
import { getGames } from "../api/gameApi";
import { getRanksByGame } from "../api/rankApi";
import {
  exportarReporteUso,
  generarReporteUso,
  obtenerDatosReporteUso,
  obtenerReportesUso,
  obtenerTiposAnalisis,
  obtenerUltimoReporteUso,
} from "../api/reportesApi";
import { useComparacionUltimosReportes } from "./useComparacionUltimosReportes";
import { descargarArchivo } from "../utils/descargas";
import { logError } from "../utils/logs";
import { validarFranjasRangos, validarPeriodoReporte } from "../utils/reportes";

const FRANJA_VACIA = { min_rank_id: "", max_rank_id: "" };

function mensajeDeError(error, porDefecto) {
  if (!error.response) {
    return "No pudimos conectar con el servidor. Intentá de nuevo.";
  }
  const data = error.response.data;
  if (typeof data?.error === "string") return data.error;
  if (typeof data?.detail === "string") return data.detail;
  if (error.response.status === 403) {
    return "No tenés permisos para acceder a los reportes.";
  }
  return porDefecto;
}

// Las cargas son funciones de modulo (no useCallback del componente) por la
// regla set-state-in-effect, igual que cargarVideojuegos en useGames.js.
async function cargarCatalogo({ setCatalogo }) {
  try {
    const [juegos, tipos] = await Promise.all([
      getGames(),
      obtenerTiposAnalisis(),
    ]);
    setCatalogo({ cargando: false, juegos: juegos ?? [], tipos, error: "" });
  } catch (error) {
    logError("Error al cargar el catálogo de reportes:", error);
    setCatalogo({
      cargando: false,
      juegos: [],
      tipos: [],
      error: mensajeDeError(
        error,
        "No se pudo cargar el catálogo de reportes."
      ),
    });
  }
}

// Ultimo reporte e historial del juego y tipo elegidos. Se guardan junto a la
// clave pedida: mientras no coincida con la seleccion actual, se considera que
// esta cargando (mismo criterio que usePerfilJugador). Preselecciona como
// fecha inicial el primer dia valido despues del ultimo reporte.
async function cargarAntecedentes({
  clave,
  filtro,
  setAntecedentes,
  setFechas,
}) {
  try {
    const [ultimo, historial] = await Promise.all([
      obtenerUltimoReporteUso(filtro),
      obtenerReportesUso(filtro),
    ]);
    setAntecedentes({ clave, ultimo, historial: historial ?? [], error: "" });
    setFechas({ inicio: ultimo?.suggested_start_date ?? "", fin: "" });
  } catch (error) {
    logError("Error al cargar los reportes de uso previos:", error);
    setAntecedentes({
      clave,
      ultimo: null,
      historial: [],
      error: mensajeDeError(
        error,
        "No se pudieron cargar los reportes previos."
      ),
    });
  }
}

async function cargarRangos({ videogameId, setRangos }) {
  try {
    const rangos = await getRanksByGame(videogameId);
    // Ordenados por `value`, el orden real del rango (de menor a mayor).
    const ordenados = [...(rangos ?? [])].sort((a, b) => a.value - b.value);
    setRangos({ videogameId, lista: ordenados, error: "" });
  } catch (error) {
    logError("Error al cargar los rangos del videojuego:", error);
    setRangos({
      videogameId,
      lista: [],
      error: "No se pudieron cargar los rangos del videojuego.",
    });
  }
}

// US 38 - Generar reporte de uso por videojuego: distribucion por rangos,
// personajes mas utilizados o franjas de rangos con mas equipos.
// videogameId "" = todos los videojuegos.
export function useReporteUsoPorJuego() {
  const [catalogo, setCatalogo] = useState({
    cargando: true,
    juegos: [],
    tipos: [],
    error: "",
  });

  const [videogameId, setVideogameId] = useState("");
  const [tipo, setTipo] = useState("ranks");
  const [fechas, setFechas] = useState({ inicio: "", fin: "" });
  const [franjas, setFranjas] = useState([FRANJA_VACIA]);

  const [antecedentes, setAntecedentes] = useState({
    clave: null,
    ultimo: null,
    historial: [],
    error: "",
  });
  const [rangos, setRangos] = useState({
    videogameId: null,
    lista: [],
    error: "",
  });

  const [reporte, setReporte] = useState(null);
  const [generando, setGenerando] = useState(false);
  const [errorGenerar, setErrorGenerar] = useState("");

  const [exportando, setExportando] = useState(null);
  const [errorExportar, setErrorExportar] = useState("");

  const clave = `${videogameId}|${tipo}`;
  const usaFranjas = tipo === "teams" && Boolean(videogameId);

  useEffect(() => {
    cargarCatalogo({ setCatalogo });
  }, []);

  const recargarAntecedentes = useCallback(
    () =>
      cargarAntecedentes({
        clave,
        filtro: { videogame_id: videogameId, analysis_type: tipo },
        setAntecedentes,
        setFechas,
      }),
    [clave, videogameId, tipo]
  );

  useEffect(() => {
    recargarAntecedentes();
  }, [recargarAntecedentes]);

  useEffect(() => {
    if (usaFranjas) {
      cargarRangos({ videogameId, setRangos });
    }
  }, [usaFranjas, videogameId]);

  const cargandoAntecedentes = antecedentes.clave !== clave;
  const ultimo = cargandoAntecedentes ? null : antecedentes.ultimo;
  const inicioMinimo = ultimo?.suggested_start_date ?? null;
  const rangosDelJuego = rangos.videogameId === videogameId ? rangos.lista : [];

  // Cambiar de juego o de tipo arranca de cero: el reporte mostrado y las
  // franjas eran de la seleccion anterior.
  function limpiarResultado() {
    setReporte(null);
    setErrorGenerar("");
    setErrorExportar("");
  }

  function elegirJuego(id) {
    limpiarResultado();
    setFranjas([FRANJA_VACIA]);
    setVideogameId(id);
  }

  function elegirTipo(valor) {
    limpiarResultado();
    setTipo(valor);
  }

  function agregarFranja() {
    setFranjas((actuales) => [...actuales, FRANJA_VACIA]);
  }

  function quitarFranja(indice) {
    setFranjas((actuales) => actuales.filter((_, i) => i !== indice));
  }

  function cambiarFranja(indice, campo, valor) {
    setFranjas((actuales) =>
      actuales.map((franja, i) =>
        i === indice ? { ...franja, [campo]: valor } : franja
      )
    );
  }

  async function generar() {
    setErrorGenerar("");
    setErrorExportar("");

    const errorPeriodo = validarPeriodoReporte({
      fechaInicio: fechas.inicio,
      fechaFin: fechas.fin,
      inicioMinimo,
    });
    if (errorPeriodo) {
      setErrorGenerar(errorPeriodo);
      return false;
    }

    if (usaFranjas) {
      const errorFranjas = validarFranjasRangos(franjas, rangosDelJuego);
      if (errorFranjas) {
        setErrorGenerar(errorFranjas);
        return false;
      }
    }

    try {
      setGenerando(true);
      const nuevo = await generarReporteUso({
        videogame_id: videogameId,
        analysis_type: tipo,
        start_date: fechas.inicio,
        end_date: fechas.fin,
        rank_bands: usaFranjas
          ? franjas.map((f) => ({
              min_rank_id: Number(f.min_rank_id),
              max_rank_id: Number(f.max_rank_id),
            }))
          : null,
      });
      setReporte(nuevo);
      // El nuevo pasa a ser el "ultimo" de este juego y tipo.
      await recargarAntecedentes();
      return true;
    } catch (error) {
      logError("Error al generar el reporte de uso:", error);
      setErrorGenerar(
        mensajeDeError(error, "Ocurrió un error al generar el reporte.")
      );
      return false;
    } finally {
      setGenerando(false);
    }
  }

  async function exportar(reportId, formato) {
    setErrorExportar("");
    try {
      setExportando(`${reportId}-${formato}`);
      const { blob, nombreArchivo } = await exportarReporteUso(
        reportId,
        formato
      );
      descargarArchivo(blob, nombreArchivo);
    } catch (error) {
      logError("Error al exportar el reporte de uso:", error);
      setErrorExportar(
        mensajeDeError(error, "No se pudo exportar el reporte.")
      );
    } finally {
      setExportando(null);
    }
  }

  // Tortas del ultimo reporte y el anterior del juego y tipo elegidos.
  const historialVigente = cargandoAntecedentes ? [] : antecedentes.historial;
  const comparacion = useComparacionUltimosReportes(
    historialVigente,
    obtenerDatosReporteUso
  );

  return {
    comparacion: {
      ...comparacion,
      cargando: cargandoAntecedentes || comparacion.cargando,
    },

    cargandoCatalogo: catalogo.cargando,
    juegos: catalogo.juegos,
    tipos: catalogo.tipos,
    errorCatalogo: catalogo.error,

    videogameId,
    tipo,
    elegirJuego,
    elegirTipo,

    fechaInicio: fechas.inicio,
    fechaFin: fechas.fin,
    setFechaInicio: (inicio) => setFechas((f) => ({ ...f, inicio })),
    setFechaFin: (fin) => setFechas((f) => ({ ...f, fin })),
    inicioMinimo,

    usaFranjas,
    franjas,
    rangosDelJuego,
    errorRangos: rangos.videogameId === videogameId ? rangos.error : "",
    agregarFranja,
    quitarFranja,
    cambiarFranja,

    cargandoAntecedentes,
    ultimo,
    historial: historialVigente,
    errorAntecedentes: cargandoAntecedentes ? "" : antecedentes.error,

    reporte,
    generando,
    errorGenerar,
    generar,

    exportando,
    errorExportar,
    exportar,
  };
}
