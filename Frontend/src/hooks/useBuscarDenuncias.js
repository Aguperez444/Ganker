import { useCallback, useEffect, useState } from "react";
import { buscarDenuncias } from "../api/moderacionApi";
import { logError } from "../utils/logs";

export const TAMANIO_PAGINA_DENUNCIAS = 10;

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

async function cargarDenuncias({ setEstado, filtros, pagina }) {
  setEstado((actual) => ({ ...actual, cargando: true, error: "" }));

  try {
    const registros = await buscarDenuncias({
      ...filtros,
      skip: pagina * TAMANIO_PAGINA_DENUNCIAS,
      limit: TAMANIO_PAGINA_DENUNCIAS + 1,
    });

    setEstado({
      denuncias: registros.slice(0, TAMANIO_PAGINA_DENUNCIAS).map(aFilaDeDenuncia),
      hayMas: registros.length > TAMANIO_PAGINA_DENUNCIAS,
      filtros,
      pagina,
      cargando: false,
      error: "",
    });
  } catch (error) {
    logError("Error al buscar las denuncias:", error);
    setEstado((actual) => ({
      ...actual,
      cargando: false,
      error: error?.response?.data?.error?.message || "No se pudieron buscar las denuncias.",
    }));
  }
}

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

export function hayFiltrosDeDenuncias(filtros = {}) {
  return Object.values(filtros).some((valor) => valor);
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
    cargarDenuncias({ setEstado, filtros: FILTROS_DENUNCIAS_VACIOS, pagina: 0 });
  }, []);

  const buscar = useCallback(
    (filtros) => cargarDenuncias({ setEstado, filtros, pagina: 0 }),
    []
  );

  const irAPagina = (pagina) => cargarDenuncias({ setEstado, filtros: estado.filtros, pagina });

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
