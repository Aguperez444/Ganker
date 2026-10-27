import { useCallback, useEffect, useState } from "react";
import { buscarDenuncias } from "../api/moderacionApi";
import { logError } from "../utils/logs";

export const TAMANIO_PAGINA_DENUNCIAS = 10;

export const FILTROS_DENUNCIAS_VACIOS = {
  denunciado: "",
  denunciante: "",
  resueltoPor: "",
  estado: "",
  motivo: "",
  fechaCreacionDesde: "",
  fechaCreacionHasta: "",
  fechaResolucionDesde: "",
  fechaResolucionHasta: "",
};

function aFilaDeDenuncia(registro) {
  return {
    id: registro.id,
    reported_user_id: registro.reported_user_id,
    reported_user_name: registro.reported_user_name,
    reporter_user_id: registro.reporter_user_id,
    reporter_user_name: registro.reporter_user_name,
    status: registro.status,
    reason: registro.reason,
    description: registro.description ?? "No se especificó una descripción",
    created_at: registro.created_at,
    resolved_at: registro.resolved_at,
    resolved_by: registro.resolved_by,
  };
}

function fechaLocalAISO(valor) {
  if (!valor) return "";

  const fecha = new Date(valor);

  if (Number.isNaN(fecha.getTime())) return "";

  return fecha.toISOString();
}

function prepararFiltrosDenuncias(filtros) {
  const limpiarUsername = (valor) => (valor ?? "").trim().replace(/^@/, "");

  return {
    denunciado: limpiarUsername(filtros.denunciado),
    denunciante: limpiarUsername(filtros.denunciante),
    resueltoPor: limpiarUsername(filtros.resueltoPor),
    estado: (filtros.estado ?? "").trim(),
    motivo: (filtros.motivo ?? "").trim(),

    fechaCreacionDesde: fechaLocalAISO(filtros.fechaCreacionDesde),
    fechaCreacionHasta: fechaLocalAISO(filtros.fechaCreacionHasta),
    fechaResolucionDesde: fechaLocalAISO(filtros.fechaResolucionDesde),
    fechaResolucionHasta: fechaLocalAISO(filtros.fechaResolucionHasta),
  };
}

async function cargarDenuncias({ setEstado, filtros, pagina }) {
  setEstado((actual) => ({
    ...actual,
    cargando: true,
    error: "",
  }));

  try {
    const registros = await buscarDenuncias({
      ...prepararFiltrosDenuncias(filtros),
      skip: pagina * TAMANIO_PAGINA_DENUNCIAS,
      limit: TAMANIO_PAGINA_DENUNCIAS + 1,
    });

    setEstado({
      denuncias: registros
        .slice(0, TAMANIO_PAGINA_DENUNCIAS)
        .map(aFilaDeDenuncia),
      hayMas: registros.length > TAMANIO_PAGINA_DENUNCIAS,
      filtros,
      pagina,
      cargando: false,
      error: "",
    });
  } catch (error) {
    logError("Error al buscar las denuncias:", error);

    const mensaje = error?.response?.data?.error;

    setEstado((actual) => ({
      ...actual,
      cargando: false,
      error:
        typeof mensaje === "string"
          ? mensaje
          : "No se pudieron buscar las denuncias.",
    }));
  }
}

export function validarFiltrosDenuncias(filtros) {
  const errores = {};

  if (
    filtros.fechaCreacionDesde &&
    filtros.fechaCreacionHasta &&
    filtros.fechaCreacionDesde > filtros.fechaCreacionHasta
  ) {
    errores.fechaCreacion =
      "La fecha inicial de creación no puede ser posterior a la final.";
  }

  if (
    filtros.fechaResolucionDesde &&
    filtros.fechaResolucionHasta &&
    filtros.fechaResolucionDesde > filtros.fechaResolucionHasta
  ) {
    errores.fechaResolucion =
      "La fecha inicial de resolución no puede ser posterior a la final.";
  }

  return errores;
}

export function hayFiltrosDeDenuncias(filtros = {}) {
  return Object.values(filtros).some(
    (valor) => String(valor ?? "").trim() !== ""
  );
}

export function useBuscarDenuncias() {
  const [estado, setEstado] = useState({
    denuncias: [],
    hayMas: false,
    filtros: FILTROS_DENUNCIAS_VACIOS,
    pagina: 0,
    cargando: true,
    error: "",
  });

  useEffect(() => {
    cargarDenuncias({
      setEstado,
      filtros: FILTROS_DENUNCIAS_VACIOS,
      pagina: 0,
    });
  }, []);

  const buscar = useCallback(
    (filtros) =>
      cargarDenuncias({
        setEstado,
        filtros,
        pagina: 0,
      }),
    []
  );

  const irAPagina = (pagina) =>
    cargarDenuncias({
      setEstado,
      filtros: estado.filtros,
      pagina,
    });

  const recargar = () => irAPagina(estado.pagina);

  return {
    denuncias: estado.denuncias,
    hayMas: estado.hayMas,
    pagina: estado.pagina,
    filtrosAplicados: estado.filtros,
    cargando: estado.cargando,
    error: estado.error,

    buscar,
    paginaAnterior: () => irAPagina(Math.max(estado.pagina - 1, 0)),
    paginaSiguiente: () => irAPagina(estado.pagina + 1),
    recargar,
  };
}
