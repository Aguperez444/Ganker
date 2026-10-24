import { nombreDeMotivoReporte } from "../../utils/reportesJugadores";

const formatearFecha = (fecha) => {
  if (!fecha) return "-";
  try {
    return new Date(fecha).toLocaleString("es-AR");
  } catch {
    return fecha;
  }
};

const estadoEtiqueta = (estado) => {
  if (estado === "resolved") return "Resuelto";
  if (estado === "pending") return "Pendiente";
  return estado || "-";
};

const ListaDenunciasComponent = ({
  denuncias = [],
  cargando = false,
  error = "",
  hayFiltros = false,
  pagina = 0,
  hayMas = false,
  onPaginaAnterior,
  onPaginaSiguiente,
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
              <th className="px-4 py-3 text-left text-xs font-semibold tracking-wide text-ganker-muted uppercase">
                Creado
              </th>
              <th className="px-4 py-3 text-left text-xs font-semibold tracking-wide text-ganker-muted uppercase">
                Resuelto por
              </th>
              <th className="px-4 py-3 text-left text-xs font-semibold tracking-wide text-ganker-muted uppercase">
                Resuelto
              </th>
              <th className="px-4 py-3 text-left text-xs font-semibold tracking-wide text-ganker-muted uppercase">
                Descripción
              </th>
            </tr>
          </thead>
          <tbody className="divide-y divide-white/5">
            {denuncias.map((denuncia) => (
              <tr key={denuncia.id} className="hover:bg-white/5">
                <td className="px-4 py-3">
                  <p className="font-semibold text-ganker-text">@{denuncia.reported_user_name}</p>
                  <p className="text-xs text-ganker-muted">ID {denuncia.reported_user_id}</p>
                </td>
                <td className="px-4 py-3">
                  <p className="text-ganker-text">@{denuncia.reporter_user_name}</p>
                  <p className="text-xs text-ganker-muted">ID {denuncia.reporter_user_id}</p>
                </td>
                <td className="px-4 py-3 text-ganker-text">{nombreDeMotivoReporte(denuncia.reason)}</td>
                <td className="px-4 py-3 text-ganker-text">{estadoEtiqueta(denuncia.status)}</td>
                <td className="px-4 py-3 text-ganker-muted">{formatearFecha(denuncia.created_at)}</td>
                <td className="px-4 py-3 text-ganker-muted">
                  {denuncia.resolved_by ? `@${denuncia.resolved_by}` : "-"}
                </td>
                <td className="px-4 py-3 text-ganker-muted">{formatearFecha(denuncia.resolved_at)}</td>
                <td className="max-w-xs px-4 py-3 text-ganker-muted">
                  <p className="line-clamp-3">{denuncia.description}</p>
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

export default ListaDenunciasComponent;
