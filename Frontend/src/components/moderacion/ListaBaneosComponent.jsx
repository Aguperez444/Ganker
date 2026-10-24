import {
  esBaneoVigente,
  esVencimientoPermanente,
  formatearFechaBaneo,
  formatearVencimiento,
} from "../../utils/baneos";

function describirVencimiento(baneo) {
  if (!esBaneoVigente(baneo.expires_at)) {
    return `Venció ${formatearFechaBaneo(baneo.expires_at)}`;
  }
  if (!baneo.expires_at || esVencimientoPermanente(baneo.expires_at)) {
    return "Permanente";
  }
  return `Vence ${formatearVencimiento(baneo.expires_at)}`;
}

// Buscar jugadores baneados: resultados de una página del historial, ya
// ordenados por el backend del baneo más nuevo al más viejo. "Desbanear" se
// ofrece solo en los baneos vigentes y nunca sobre la propia cuenta.
const ListaBaneosComponent = ({
  baneos,
  cargando,
  error,
  hayFiltros,
  pagina,
  hayMas,
  miId,
  onDesbanear,
  onPaginaAnterior,
  onPaginaSiguiente,
}) => {
  if (error) {
    return (
      <div className="mt-5 rounded-lg border border-ganker-error/20 bg-ganker-error/10 px-4 py-3">
        <p className="text-sm text-ganker-error">{error}</p>
      </div>
    );
  }

  const mostrarPaginacion = pagina > 0 || hayMas;

  return (
    <div className="mt-5">
      {baneos.length === 0 ? (
        <p className="text-sm text-ganker-muted">
          {cargando
            ? "Cargando baneos..."
            : hayFiltros
              ? "No se encontraron baneos que coincidan con los filtros aplicados."
              : "No hay jugadores baneados."}
        </p>
      ) : (
        <ul
          aria-busy={cargando}
          className={`divide-y divide-white/10 overflow-hidden rounded-xl border border-white/10 transition ${cargando ? "opacity-60" : ""}`}
        >
          {baneos.map((baneo) => {
            const vigente = esBaneoVigente(baneo.expires_at);

            return (
              <li
                key={baneo.id}
                className="flex flex-col gap-2 bg-ganker-surface-light px-4 py-3 sm:flex-row sm:items-center sm:justify-between"
              >
                <div className="min-w-0">
                  <div className="flex flex-wrap items-center gap-2">
                    <p className="truncate font-medium text-ganker-text">
                      @{baneo.username} · ID {baneo.user_id}
                    </p>
                    <span
                      className={`rounded-full px-2 py-0.5 text-xs font-semibold ${
                        vigente
                          ? "bg-ganker-error/10 text-ganker-error"
                          : "bg-white/5 text-ganker-muted"
                      }`}
                    >
                      {vigente ? "Vigente" : "Vencido"}
                    </span>
                  </div>
                  <p className="mt-0.5 truncate text-xs text-ganker-muted">
                    {baneo.reason}
                  </p>
                  <p className="mt-0.5 text-xs text-ganker-muted">
                    Baneado por @{baneo.admin_username} el{" "}
                    {formatearFechaBaneo(baneo.created_at)} ·{" "}
                    {describirVencimiento(baneo)}
                  </p>
                </div>

                {vigente && baneo.user_id !== miId && (
                  <button
                    type="button"
                    onClick={() => onDesbanear(baneo)}
                    className="shrink-0 cursor-pointer self-start rounded-lg border border-ganker-purple/60 px-3 py-1.5 text-sm font-semibold text-ganker-purple-light transition hover:bg-ganker-purple/20 sm:self-auto"
                  >
                    Desbanear
                  </button>
                )}
              </li>
            );
          })}
        </ul>
      )}

      {mostrarPaginacion && (
        <nav
          aria-label="Paginación de baneos"
          className="mt-4 flex items-center justify-between gap-3"
        >
          <button
            type="button"
            onClick={onPaginaAnterior}
            disabled={cargando || pagina === 0}
            className="cursor-pointer rounded-lg border border-white/10 px-3 py-1.5 text-sm font-semibold text-ganker-text transition hover:bg-white/5 disabled:cursor-not-allowed disabled:opacity-50"
          >
            Anterior
          </button>
          <p className="text-xs text-ganker-muted">Página {pagina + 1}</p>
          <button
            type="button"
            onClick={onPaginaSiguiente}
            disabled={cargando || !hayMas}
            className="cursor-pointer rounded-lg border border-white/10 px-3 py-1.5 text-sm font-semibold text-ganker-text transition hover:bg-white/5 disabled:cursor-not-allowed disabled:opacity-50"
          >
            Siguiente
          </button>
        </nav>
      )}
    </div>
  );
};

export default ListaBaneosComponent;
