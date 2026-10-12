import { useEffect, useState } from "react";
import { obtenerMiEquipo, actualizarEquipo } from "../api/teamApi";
import { mensajeDeError } from "../utils/errores";

// US 04 - Modificar equipo.
//
// Carga el equipo activo del jugador logueado (GET /api/v1/teams/me) y expone
// `actualizar` para editarlo (PUT /api/v1/teams/{id}). El backend solo deja
// editar al líder: si el jugador no lo es, la tarjeta de "mi equipo" no ofrece
// el botón, pero igual se muestra la vista.
//
// `recargaToken` permite forzar una recarga desde afuera (por ejemplo, después
// de unirse a un equipo desde el buscador) sin exponer los setters.
export function useMiEquipo(recargaToken = 0) {
  const [equipo, setEquipo] = useState(null);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState("");
  const [guardando, setGuardando] = useState(false);

  useEffect(() => {
    let cancelado = false;

    const cargar = async () => {
      try {
        setIsLoading(true);
        setError("");

        const miEquipo = await obtenerMiEquipo();
        if (!cancelado) setEquipo(miEquipo ?? null);
      } catch (err) {
        console.error("Error al cargar mi equipo:", err);
        if (!cancelado) {
          setEquipo(null);
          setError("No se pudo cargar tu equipo.");
        }
      } finally {
        if (!cancelado) setIsLoading(false);
      }
    };

    cargar();
    return () => {
      cancelado = true;
    };
  }, [recargaToken]);

  // Devuelve { ok, mensaje }. En éxito reemplaza el equipo con el resumen
  // actualizado que manda el backend (ya viene con vista del jugador actual).
  const actualizar = async (payload) => {
    if (!equipo) {
      return { ok: false, mensaje: "No tenés un equipo activo para editar." };
    }

    setGuardando(true);

    try {
      const respuesta = await actualizarEquipo(equipo.team_id, payload);
      setEquipo(respuesta.data);
      return { ok: true, mensaje: respuesta.message };
    } catch (err) {
      console.error("Error al modificar el equipo:", err);
      return {
        ok: false,
        mensaje: mensajeDeError(err, "No se pudo modificar el equipo."),
      };
    } finally {
      setGuardando(false);
    }
  };

  return { equipo, isLoading, error, guardando, actualizar };
}

export default useMiEquipo;
