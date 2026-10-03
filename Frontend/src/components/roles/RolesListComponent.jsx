import { resolveIconUrl } from "../../utils/media";

const RolesListComponent = ({ roles, isLoading, error }) => {
  if (isLoading) {
    return (
      <div className="rounded-xl border border-white/10 bg-ganker-surface-light p-6">
        <p className="text-sm text-ganker-muted">Cargando roles...</p>
      </div>
    );
  }

  if (error) {
    return (
      <div className="rounded-xl border border-ganker-error/20 bg-ganker-error/10 p-6">
        <p className="text-sm text-ganker-error">{error}</p>
      </div>
    );
  }

  if (roles.length === 0) {
    return (
      <div className="rounded-xl border border-white/10 bg-ganker-surface-light p-6">
        <p className="text-sm text-ganker-muted">
          Este videojuego todavía no tiene roles registrados.
        </p>
      </div>
    );
  }

  const sortedRoles = [...roles].sort((a, b) => a.name.localeCompare(b.name));

  return (
    <div className="overflow-hidden rounded-xl border border-white/10">
      <ul className="divide-y divide-white/10">
        {sortedRoles.map((role) => (
          <li
            key={role.id}
            className="flex items-center justify-between gap-4 bg-ganker-surface-light px-5 py-4 transition hover:bg-white/5"
          >
            <div className="flex min-w-0 items-center gap-3">
              {resolveIconUrl(role.icon_url) ? (
                <img
                  src={resolveIconUrl(role.icon_url)}
                  alt={role.name}
                  className="h-10 w-10 shrink-0 rounded-lg border border-white/10 bg-ganker-surface object-cover"
                  onError={(e) => {
                    e.currentTarget.style.display = "none";
                  }}
                />
              ) : (
                <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-lg border border-white/10 bg-white/5 text-ganker-muted">
                  <svg
                    className="h-5 w-5"
                    fill="none"
                    viewBox="0 0 24 24"
                    stroke="currentColor"
                  >
                    <path
                      strokeLinecap="round"
                      strokeLinejoin="round"
                      strokeWidth={1.5}
                      d="M15 5v2m0 4v2m0 4v2M5 5a2 2 0 00-2 2v3a2 2 0 110 4v3a2 2 0 002 2h14a2 2 0 002-2v-3a2 2 0 110-4V7a2 2 0 00-2-2H5z"
                    />
                  </svg>
                </div>
              )}

              <p className="truncate font-medium text-ganker-text">
                {role.name}
              </p>
            </div>
          </li>
        ))}
      </ul>
    </div>
  );
};

export default RolesListComponent;
