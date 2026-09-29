import { useState } from "react";
import RolesListComponent from "./RolesListComponent";

const GameRolesPanelComponent = ({
  game,
  roles,
  isLoading,
  error,
  isSaving,
  selectedRoleId,
  onSelectRole,
  onDeleteRole,
  onRegisterRole,
  onClose,
}) => {
  const [searchTerm, setSearchTerm] = useState("");

  const search = searchTerm.trim().toLowerCase();

  const visibleRoles = roles.filter((role) =>
    role.name.toLowerCase().includes(search)
  );

  return (
    <section className="rounded-2xl border border-white/10 bg-ganker-surface p-6 shadow-xl">
      <header className="mb-6 flex items-start justify-between gap-3">
        <div className="min-w-0">
          <h2 className="font-heading text-xl font-semibold text-ganker-text">
            Roles de {game.name}
          </h2>

          <p className="mt-1 text-sm text-ganker-muted">
            {roles.length} {roles.length === 1 ? "rol registrado" : "roles registrados"}.
            Elegí uno para modificarlo.
          </p>
        </div>

        <button
          type="button"
          onClick={onClose}
          className="shrink-0 cursor-pointer rounded-lg border border-white/10 px-3 py-1.5 text-xs font-semibold text-ganker-muted transition hover:bg-white/5 hover:text-ganker-text"
        >
          Cerrar
        </button>
      </header>

      <div className="mb-6 flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
        <input
          type="text"
          value={searchTerm}
          onChange={(event) => setSearchTerm(event.target.value)}
          placeholder="Buscar rol por nombre..."
          aria-label="Buscar rol por nombre"
          className="w-full rounded-lg border border-white/10 bg-ganker-surface-light px-4 py-2.5 text-sm text-ganker-text placeholder:text-ganker-muted outline-none transition-all duration-200 focus:border-ganker-purple-light focus:ring-2 focus:ring-ganker-purple/30"
        />

        <button
          type="button"
          onClick={onRegisterRole}
          disabled={isSaving}
          className="shrink-0 cursor-pointer rounded-lg border border-white/10 bg-ganker-surface-light px-4 py-2.5 text-sm font-semibold text-ganker-text transition-all duration-200 hover:border-ganker-orange hover:bg-ganker-orange hover:text-white hover:-translate-y-0.5 hover:shadow-lg hover:shadow-ganker-orange/20 disabled:cursor-not-allowed disabled:opacity-50"
        >
          + Registrar rol
        </button>
      </div>

      <RolesListComponent
        roles={visibleRoles}
        isLoading={isLoading}
        error={error}
        selectedRoleId={selectedRoleId}
        onSelectRole={onSelectRole}
        onDeleteRole={onDeleteRole}
      />
    </section>
  );
};

export default GameRolesPanelComponent;
