import { useEffect, useState } from "react";
import { obtenerHistorialBaneos } from "../../api/moderacionApi";
import ListaBaneosComponent from "./ListaBaneosComponent";

export default function BaneosJugadorComponent({
  jugadorId,
  antesDeBaneoId,
  onVerDetalle,
  pagina: paginaControlada,
  onPaginaChange,
}) {
  const [paginaInterna, setPaginaInterna] = useState(0);
  const pagina = paginaControlada ?? paginaInterna;
  const cambiarPagina = onPaginaChange ?? setPaginaInterna;
  const [reintento, setReintento] = useState(0);
  const [consulta, setConsulta] = useState({});
  const clave = `${jugadorId}:${antesDeBaneoId}:${pagina}:${reintento}`;
  const cargando = consulta.clave !== clave;

  useEffect(() => {
    let activo = true;
    obtenerHistorialBaneos(jugadorId, {
      antesDeBaneoId,
      skip: pagina * 10,
      limit: 11,
    }).then(
      (filas) => {
        if (activo)
          setConsulta({
            clave,
            filas: filas.slice(0, 10),
            hayMas: filas.length > 10,
          });
      },
      () => {
        if (activo)
          setConsulta({
            clave,
            error: "No se pudo cargar el historial de baneos.",
          });
      }
    );
    return () => {
      activo = false;
    };
  }, [jugadorId, antesDeBaneoId, pagina, clave]);

  return (
    <div>
      <ListaBaneosComponent
        baneos={
          cargando
            ? []
            : (consulta.filas ?? []).map((fila) => ({
                id: fila.id,
                user_id: fila.user_id,
                username: fila.username,
                admin_username: fila.banned_by_username,
                created_at: fila.created_at,
                expires_at: fila.ended_at || fila.expires_at,
                reason: fila.reason,
                status: fila.status,
              }))
        }
        cargando={cargando}
        error={cargando ? "" : consulta.error}
        hayFiltros={false}
        pagina={pagina}
        hayMas={consulta.hayMas}
        onPaginaAnterior={() => cambiarPagina(Math.max(0, pagina - 1))}
        onPaginaSiguiente={() => cambiarPagina(pagina + 1)}
        onVerDetalle={onVerDetalle}
        mensajeVacio={
          antesDeBaneoId
            ? "No registra baneos anteriores."
            : "No registra baneos."
        }
      />
      {!cargando && consulta.error && (
        <button
          type="button"
          onClick={() => setReintento((actual) => actual + 1)}
          className="mt-2 cursor-pointer text-sm text-ganker-purple-light underline"
        >
          Volver a intentar
        </button>
      )}
    </div>
  );
}
