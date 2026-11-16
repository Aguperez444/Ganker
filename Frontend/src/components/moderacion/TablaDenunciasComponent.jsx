import { nombreDeMotivoReporte } from "../../utils/reportesJugadores";
import { etiquetaEstadoDenuncia } from "../../utils/denuncias";

const TablaDenunciasComponent = ({
  denuncias = [],
  cargando = false,
  error = "",
  hayFiltros = false,
  pagina = 0,
  hayMas = false,
  onPaginaAnterior,
  onPaginaSiguiente,
  onVerDetalle,
}) => {
  if (cargando && denuncias.length === 0) {
    return (
      <div className="mt-6 rounded-xl border border-white/10 bg-ganker-surface-light p-6 text-center">
        <p className="text-sm text-ganker-muted">Buscando denuncias...</p>
      </div>
    );
  }

  if (error) {
    return (
      <div className="mt-6 rounded-xl border border-ganker-error/20 bg-ganker-error/10 p-4">
        <p className="text-sm text-ganker-error">{error}</p>
      </div>
    );
  }

  if (denuncias.length === 0) {
    return (
      <div className="mt-6 rounded-xl border border-white/10 bg-ganker-surface-light p-6 text-center">
        <p className="text-sm text-ganker-muted">
          {hayFiltros
            ? "No se encontraron coincidencias con los filtros aplicados."
            : "No hay denuncias registradas."}
        </p>
      </div>
    );
  }

  return (
    <div className="mt-6 space-y-4">
      <div className="overflow-x-auto rounded-xl border border-white/10">
        <table className="min-w-full divide-y divide-white/10 text-sm">
          <thead className="bg-ganker-surface-light">
            <tr>
              <th className="px-4 py-3 text-left text-xs font-semibold tracking-wide text-ganker-muted uppercase">
                Denunciado
              </th>
              <th className="px-4 py-3 text-left text-xs font-semibold tracking-wide text-ganker-muted uppercase">
                Denunciante
              </th>
              <th className="px-4 py-3 text-left text-xs font-semibold tracking-wide text-ganker-muted uppercase">
                Motivo
              </th>
              <th className="px-4 py-3 text-left text-xs font-semibold tracking-wide text-ganker-muted uppercase">
                Estado
              </th>
              <th className="px-4 py-3 text-right text-xs font-semibold tracking-wide text-ganker-muted uppercase">
                Detalle
              </th>
            </tr>
          </thead>
          <tbody className="divide-y divide-white/5">
            {denuncias.map((denuncia) => (
              <tr key={denuncia.id} className="hover:bg-white/5">
                <td className="px-4 py-3">
                  <p className="font-semibold text-ganker-text">
                    @{denuncia.reported_user_name}
                  </p>
                </td>
                <td className="px-4 py-3">
                  <p className="text-ganker-text">
                    @{denuncia.reporter_user_name}
                  </p>
                </td>
                <td className="px-4 py-3 text-ganker-text">
                  {nombreDeMotivoReporte(denuncia.reason)}
                </td>
                <td className="px-4 py-3 text-ganker-text">
                  {etiquetaEstadoDenuncia(denuncia.status)}
                </td>
                <td className="px-4 py-3 text-right">
                  <button
                    type="button"
                    onClick={() => onVerDetalle(denuncia)}
                    aria-label={`Ver detalle del reporte de @${denuncia.reporter_user_name} a @${denuncia.reported_user_name}`}
                    className="cursor-pointer rounded-lg border border-ganker-purple-light/30 px-3 py-2 text-sm font-semibold whitespace-nowrap text-ganker-purple-light transition hover:bg-ganker-purple/10 focus-visible:outline-2 focus-visible:outline-ganker-purple-light"
                  >
                    Ver detalle
                  </button>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      <div className="flex flex-col items-center justify-between gap-3 sm:flex-row">
        <p className="text-sm text-ganker-muted">Página {pagina + 1}</p>
        <div className="flex gap-2">
          <button
            type="button"
            onClick={onPaginaAnterior}
            disabled={pagina === 0 || cargando}
            className="cursor-pointer rounded-lg border border-white/10 px-3 py-1.5 text-sm text-ganker-text transition hover:bg-white/5 disabled:cursor-not-allowed disabled:opacity-50"
          >
            Anterior
          </button>
          <button
            type="button"
            onClick={onPaginaSiguiente}
            disabled={!hayMas || cargando}
            className="cursor-pointer rounded-lg border border-white/10 px-3 py-1.5 text-sm text-ganker-text transition hover:bg-white/5 disabled:cursor-not-allowed disabled:opacity-50"
          >
            Siguiente
          </button>
        </div>
      </div>
    </div>
  );
};

export default TablaDenunciasComponent;
