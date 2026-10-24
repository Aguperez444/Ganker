import { useCallback, useEffect, useState } from "react";
import { buscarBaneos } from "../api/moderacionApi";
import { logError } from "../utils/logs";
import {
  armarFiltrosBusquedaBaneos,
  FILTROS_BANEOS_VACIOS,
  mensajeDeErrorBusquedaBaneos,
} from "../utils/baneos";

export const TAMANIO_PAGINA_BANEOS = 10;

// Se mapea a los mismos nombres que usa useDesbanearJugador (user_id,
// username) para poder abrir el desbaneo directo desde la fila.
function aFilaDeBaneo(registro) {
  return {
    id: registro.id,
    user_id: registro.banned_user_id,
    username: registro.banned_user_username,
    admin_id: registro.banned_by_user_id,
    admin_username: registro.banned_by_user_username,
    created_at: registro.date_created,
    expires_at: registro.date_expire,
    reason: registro.reason,
  };
}

// Funcion de modulo por el mismo motivo que cargarEquipo en useEquipo.js
// (regla set-state-in-effect).
async function cargarBaneos({ setEstado, filtros, pagina }) {
  setEstado((actual) => ({ ...actual, cargando: true, error: "" }));

  try {
    // El backend no devuelve el total: se pide uno más que el tamaño de la
    // página y, si llega, hay página siguiente.
    const registros = await buscarBaneos({
      ...armarFiltrosBusquedaBaneos(filtros),
      skip: pagina * TAMANIO_PAGINA_BANEOS,
      limit: TAMANIO_PAGINA_BANEOS + 1,
    });

    setEstado({
      baneos: registros.slice(0, TAMANIO_PAGINA_BANEOS).map(aFilaDeBaneo),
      hayMas: registros.length > TAMANIO_PAGINA_BANEOS,
      filtros,
      pagina,
      cargando: false,
      error: "",
    });
  } catch (error) {
    logError("Error al buscar los baneos:", error);
    setEstado((actual) => ({
      ...actual,
      cargando: false,
      error: mensajeDeErrorBusquedaBaneos(error),
    }));
  }
}

// Buscar jugadores baneados (admin), en Admin > Moderación.
//
// Filtros, orden (del más nuevo al más viejo), paginación y exclusión de
// usuarios borrados los resuelve el backend. El hook guarda los últimos
// filtros aplicados para que cambiar de página o recargar después de un
// desbaneo no dependa de lo que esté escrito en el formulario.
export function useBuscarBaneos() {
  const [estado, setEstado] = useState({
    baneos: [],
    hayMas: false,
    filtros: FILTROS_BANEOS_VACIOS,
    pagina: 0,
    cargando: true,
    error: "",
  });

  useEffect(() => {
    cargarBaneos({ setEstado, filtros: FILTROS_BANEOS_VACIOS, pagina: 0 });
  }, []);

  // Filtros nuevos: vuelve a la primera página.
  const buscar = useCallback(
    (filtros) => cargarBaneos({ setEstado, filtros, pagina: 0 }),
    []
  );

  const irAPagina = (pagina) =>
    cargarBaneos({ setEstado, filtros: estado.filtros, pagina });

  // Después de desbanear: misma búsqueda y misma página.
  const recargar = () => irAPagina(estado.pagina);

  return {
    baneos: estado.baneos,
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
