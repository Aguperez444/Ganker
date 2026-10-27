import { Link } from "react-router-dom";
import {
  esBaneoVigente,
  formatearFechaBaneo,
  formatearVencimiento,
} from "../../utils/baneos";

// Ultimos baneos para el inicio del panel admin. Recibe las filas ya
// mapeadas por useBuscarBaneos ({ id, username, admin_username, created_at,
// expires_at, reason }).
function BaneosRecientesComponent({ baneos, cargando, error, limite = 5 }) {
  const visibles = baneos.slice(0, limite);

  return (
    <section className="rounded-2xl border border-white/10 bg-ganker-surface p-5">
      <div className="flex items-center justify-between">
        <h2 className="font-heading text-lg font-semibold text-ganker-text">
          Baneos recientes
        </h2>
        <Link
          to="/app/admin/moderacion"
          className="text-sm font-semibold text-ganker-purple-light hover:underline"
        >
          Ver todos →
        </Link>
      </div>

      {cargando ? (
        <p className="mt-4 text-sm text-ganker-muted">Cargando baneos...</p>
      ) : error ? (
        <p className="mt-4 text-sm text-ganker-error">{error}</p>
      ) : visibles.length === 0 ? (
        <p className="mt-4 text-sm text-ganker-muted">
          No hay baneos registrados.
        </p>
      ) : (
        <ul className="mt-3 divide-y divide-white/5">
          {visibles.map((baneo) => {
            const vigente = esBaneoVigente(baneo.expires_at);
            return (
              <li key={baneo.id} className="flex items-start gap-3 py-3">
                <span
                  aria-hidden="true"
                  className={`mt-1.5 h-2.5 w-2.5 shrink-0 rounded-full ${
                    vigente ? "bg-ganker-error" : "bg-ganker-muted/50"
                  }`}
                />
                <div className="min-w-0 flex-1">
                  <p className="flex flex-wrap items-center gap-x-2 text-sm">
                    <span className="font-semibold text-ganker-text">
                      {baneo.username}
                    </span>
                    <span
                      className={`rounded-full px-2 py-0.5 text-[11px] font-semibold ${
                        vigente
                          ? "border border-ganker-error/30 bg-ganker-error/10 text-ganker-error"
                          : "border border-white/10 bg-ganker-surface-light text-ganker-muted"
                      }`}
                    >
                      {vigente ? "Vigente" : "Vencido"}
                    </span>
                  </p>
                  <p className="mt-0.5 truncate text-xs text-ganker-muted">
                    {baneo.reason}
                  </p>
                  <p className="mt-0.5 text-[11px] text-ganker-muted/80">
                    {formatearFechaBaneo(baneo.created_at)} · por{" "}
                    {baneo.admin_username} · vence{" "}
                    {formatearVencimiento(baneo.expires_at)}
                  </p>
                </div>
              </li>
            );
          })}
        </ul>
      )}
    </section>
  );
}

export default BaneosRecientesComponent;
