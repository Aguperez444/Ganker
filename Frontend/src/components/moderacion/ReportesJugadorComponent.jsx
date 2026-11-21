import { useEffect, useState } from "react";
import { buscarDenuncias } from "../../api/moderacionApi";
import TablaDenunciasComponent from "./TablaDenunciasComponent";

const TAMANIO_PAGINA = 10;

export default function ReportesJugadorComponent({
  jugador,
  pagina,
  onPaginaChange,
  onVerDetalle,
  fechaHasta,
}) {
  const [resultado, setResultado] = useState({
    reportes: [],
    hayMas: false,
    error: "",
    pagina: null,
  });
  const [reintento, setReintento] = useState(0);
  const cargando =
    resultado.pagina !== pagina || resultado.reintento !== reintento;

  useEffect(() => {
    let activo = true;
    async function cargar() {
      try {
        const reportes = await buscarDenuncias({
          denunciadoId: jugador.user_id,
          skip: pagina * TAMANIO_PAGINA,
          limit: TAMANIO_PAGINA + 1,
          ...(fechaHasta ? { fechaCreacionHasta: fechaHasta } : {}),
        });
        if (activo)
          setResultado({
            reportes: reportes.slice(0, TAMANIO_PAGINA),
            hayMas: reportes.length > TAMANIO_PAGINA,
            error: "",
            pagina,
            reintento,
          });
      } catch {
        if (activo)
          setResultado({
            reportes: [],
            hayMas: false,
            error: "No se pudieron cargar los reportes del jugador.",
            pagina,
            reintento,
          });
      }
    }
    cargar();
    return () => {
      activo = false;
    };
  }, [jugador.user_id, pagina, reintento, fechaHasta]);

  return (
    <div className="p-5 sm:p-6">
      <p className="text-sm text-ganker-muted">
        {fechaHasta
          ? "Reportes a este jugador hasta la fecha del baneo"
          : "Todos los reportes a este jugador"}
        , del más reciente al más antiguo. Abrí un detalle para revisar la
        información y la evidencia.
      </p>
      <div aria-busy={cargando}>
        <TablaDenunciasComponent
          denuncias={cargando ? [] : resultado.reportes}
          cargando={cargando}
          error={cargando ? "" : resultado.error}
          pagina={pagina}
          hayMas={resultado.hayMas}
          onPaginaAnterior={() => onPaginaChange(Math.max(0, pagina - 1))}
          onPaginaSiguiente={() => onPaginaChange(pagina + 1)}
          onVerDetalle={onVerDetalle}
        />
      </div>
      {resultado.error && !cargando && (
        <button
          type="button"
          onClick={() => setReintento((previo) => previo + 1)}
          className="mt-3 cursor-pointer text-sm text-ganker-purple-light hover:underline"
        >
          Volver a intentar
        </button>
      )}
    </div>
  );
}
