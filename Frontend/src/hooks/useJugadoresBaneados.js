import { useState } from "react";
import { obtenerJugadoresBaneados } from "../api/moderacionApi";
import { logError } from "../utils/logs";

// Un baneo está vigente si todavía no venció. `date_expire` viene del backend
// (puede traer zona o no): si falta el dato se asume vigente para no ocultar
// una sanción real por un problema de formato.
function estaVigente(baneo) {
  if (!baneo?.date_expire) return true;

  const fecha = new Date(
    /[zZ]|[+-]\d\d:\d\d$/.test(baneo.date_expire)
      ? baneo.date_expire
      : `${baneo.date_expire}Z`
  );

  if (Number.isNaN(fecha.getTime())) return true;

  return fecha.getTime() > Date.now();
}

// US 36 - Listado de baneos vigentes (admin).
//
// El backend no expone un buscador de "este jugador esta baneado": el perfil
// publico (GET /users/{id}/profile) devuelve 404 para una cuenta baneada. Lo
// unico disponible es el listado de baneos, asi que se descarga una vez y la
// pantalla lo cruza por `banned_user_id` para saber a quien puede banear.
//
// Ojo: el endpoint devuelve TODOS los registros de baneo, incluidos los ya
// vencidos o levantados a mano (desbanear solo pone `expires_at = ahora`, no
// borra la fila). Por eso aca se filtran y solo quedan los que siguen en
// vigor, que es lo que muestran "Baneos vigentes".
//
// Se usa como cache de sesion: una vez cargado no se vuelve a pedir, salvo
// que el admin lo refresque a mano.
export function useJugadoresBaneados() {
  const [baneados, setBaneados] = useState([]);
  const [cargando, setCargando] = useState(false);
  const [error, setError] = useState("");

  async function cargar({ forzar = false } = {}) {
    if (cargando) return;
    if (!forzar && baneados.length > 0) return;

    try {
      setCargando(true);
      setError("");
      const lista = await obtenerJugadoresBaneados({ limit: 100 });
      setBaneados(lista.filter(estaVigente));
    } catch (error) {
      logError("Error al cargar los baneos:", error);
      setError(
        error.response?.status === 403
          ? "No tenés permisos para ver los baneos."
          : "No se pudo cargar la lista de baneados."
      );
    } finally {
      setCargando(false);
    }
  }

  // Un jugador esta baneado si aparece en el listado con un baneo cuyo
  // resultado ya se conoce (la lista solo trae baneos aplicados).
  function estaBaneado(userId) {
    if (userId == null) return false;
    return baneados.some((b) => b.banned_user_id === userId);
  }

  return {
    baneados,
    cargando,
    error,
    cargar,
    estaBaneado,
  };
}
