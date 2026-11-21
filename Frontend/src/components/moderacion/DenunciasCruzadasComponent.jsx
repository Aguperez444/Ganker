import { useEffect, useState } from "react";
import { obtenerDenunciasCruzadas } from "../../api/moderacionApi";
import { formatearFechaBaneo } from "../../utils/baneos";
import { etiquetaEstadoDenuncia } from "../../utils/denuncias";
import { nombreDeMotivoReporte } from "../../utils/reportesJugadores";
import { parsearFechaUTC } from "../../utils/tiempo";

function relacionTemporal(fecha, referencia) {
  const diferencia = parsearFechaUTC(fecha) - parsearFechaUTC(referencia);
  if (diferencia === 0) return "En el mismo momento";
  const minutos = Math.floor(Math.abs(diferencia) / 60000);
  const horas = Math.floor(minutos / 60);
  const resto = minutos % 60;
  const duracion = horas
    ? `${horas} h${resto ? ` ${resto} min` : ""}`
    : minutos
      ? `${minutos} min`
      : "Menos de 1 min";
  return `${duracion} ${diferencia < 0 ? "antes" : "después"} de esta denuncia`;
}

export default function DenunciasCruzadasComponent({ denuncia, onVerDetalle }) {
  const [pagina, setPagina] = useState(0);
  const [reintento, setReintento] = useState(0);
  const [consulta, setConsulta] = useState({});
  const clave = `${denuncia.id}:${pagina}:${reintento}`;
  const cargando = consulta.clave !== clave;

  useEffect(() => {
    let activo = true;
    async function cargar() {
      try {
        const datos = await obtenerDenunciasCruzadas(denuncia.id, {
          skip: pagina * 10,
          limit: 11,
        });
        if (activo)
          setConsulta({
            clave,
            datos,
            reportes: datos.reports.slice(0, 10),
            hayMas: datos.reports.length > 10,
          });
      } catch {
        if (activo)
          setConsulta({
            clave,
            error: "No se pudieron comprobar las denuncias cruzadas.",
          });
      }
    }
    cargar();
    return () => {
      activo = false;
    };
  }, [denuncia.id, pagina, clave]);

  return (
    <section
      aria-label="Denuncias cruzadas"
      className="space-y-3 rounded-xl border border-white/10 bg-ganker-surface-light p-4"
    >
      <h3 className="font-semibold text-ganker-text">Denuncias cruzadas</h3>
      <p className="text-sm text-ganker-muted">
        Reportes de{" "}
        <strong className="text-ganker-text">
          @{denuncia.reported_user_name}
        </strong>{" "}
        contra{" "}
        <strong className="text-ganker-text">
          @{denuncia.reporter_user_name}
        </strong>{" "}
        en las 48 horas anteriores o posteriores a esta denuncia.
      </p>
      <div aria-busy={cargando}>
        {cargando ? (
          <p className="text-sm text-ganker-muted">
            Comprobando denuncias cruzadas...
          </p>
        ) : consulta.error ? (
          <div role="alert" className="space-y-2 text-sm text-ganker-error">
            <p>{consulta.error}</p>
            <button
              type="button"
              onClick={() => setReintento((previo) => previo + 1)}
              className="cursor-pointer underline"
            >
              Volver a intentar
            </button>
          </div>
        ) : consulta.reportes.length === 0 ? (
          <p className="text-sm text-ganker-muted">
            No se encontraron denuncias cruzadas en este período.
          </p>
        ) : (
          <>
            <p className="mb-3 text-sm font-medium text-ganker-orange-light">
              Hay denuncias en sentido inverso dentro de los dos días de
              diferencia. Revisá su contenido y evidencia antes de decidir.
            </p>
            <ul className="divide-y divide-white/10 rounded-lg border border-white/10">
              {consulta.reportes.map((reporte) => (
                <li
                  key={reporte.id}
                  className="flex flex-col justify-between gap-3 p-3 sm:flex-row sm:items-center"
                >
                  <div className="min-w-0 space-y-1">
                    <p className="text-sm font-semibold text-ganker-text">
                      @{reporte.reporter_user_name} → @
                      {reporte.reported_user_name}
                    </p>
                    <p className="text-sm text-ganker-muted">
                      {nombreDeMotivoReporte(reporte.reason)} ·{" "}
                      {etiquetaEstadoDenuncia(reporte.status)}
                    </p>
                    <p className="text-xs text-ganker-muted">
                      {formatearFechaBaneo(reporte.created_at)} ·{" "}
                      {relacionTemporal(
                        reporte.created_at,
                        consulta.datos.reference_created_at
                      )}
                    </p>
                  </div>
                  <button
                    type="button"
                    onClick={() => onVerDetalle(reporte)}
                    aria-label={`Ver detalle de la denuncia cruzada ${reporte.id}`}
                    className="shrink-0 cursor-pointer rounded-lg border border-ganker-purple-light/30 px-3 py-2 text-sm font-semibold text-ganker-purple-light"
                  >
                    Ver detalle
                  </button>
                </li>
              ))}
            </ul>
          </>
        )}
      </div>
      {!cargando && !consulta.error && (pagina > 0 || consulta.hayMas) && (
        <nav
          aria-label="Paginación de denuncias cruzadas"
          className="flex items-center justify-between gap-3 text-sm text-ganker-muted"
        >
          <button
            type="button"
            disabled={pagina === 0}
            onClick={() => setPagina((previa) => previa - 1)}
            className="cursor-pointer rounded-lg border border-white/10 px-3 py-2 disabled:opacity-50"
          >
            Anterior
          </button>
          <p>Página {pagina + 1}</p>
          <button
            type="button"
            disabled={!consulta.hayMas}
            onClick={() => setPagina((previa) => previa + 1)}
            className="cursor-pointer rounded-lg border border-white/10 px-3 py-2 disabled:opacity-50"
          >
            Siguiente
          </button>
        </nav>
      )}
    </section>
  );
}
