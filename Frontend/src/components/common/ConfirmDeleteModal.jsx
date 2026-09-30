const ConfirmDeleteModal = ({
  isOpen,
  title = "Confirmar eliminación",
  children,
  confirmLabel = "Eliminar",
  isLoading = false,
  onConfirm,
  onCancel,
}) => {
  if (!isOpen) {
    return null;
  }

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
      <button
        type="button"
        aria-label="Cerrar confirmación"
        onClick={onCancel}
        disabled={isLoading}
        className="absolute inset-0 cursor-default bg-black/70 backdrop-blur-sm"
      />

      <section
        role="dialog"
        aria-modal="true"
        aria-labelledby="delete-modal-title"
        className="relative z-10 w-full max-w-md rounded-2xl border border-white/10 bg-ganker-surface p-6 shadow-2xl"
      >
        <header>
          <h2
            id="delete-modal-title"
            className="font-heading text-xl font-semibold text-ganker-text"
          >
            {title}
          </h2>
        </header>

        <div className="mt-4 text-sm leading-6 text-ganker-muted">
          {children}
        </div>

        <div className="mt-6 flex flex-col-reverse gap-3 sm:flex-row sm:justify-end">
          <button
            type="button"
            onClick={onCancel}
            disabled={isLoading}
            className="cursor-pointer rounded-lg border border-white/10 px-4 py-2.5 text-sm font-semibold text-ganker-muted transition hover:bg-ganker-surface-light hover:text-ganker-text disabled:cursor-not-allowed disabled:opacity-50"
          >
            Cancelar
          </button>

          <button
            type="button"
            onClick={onConfirm}
            disabled={isLoading}
            className="cursor-pointer rounded-lg bg-ganker-error px-4 py-2.5 text-sm font-semibold text-white transition hover:opacity-90 disabled:cursor-not-allowed disabled:opacity-50"
          >
            {isLoading ? "Eliminando..." : confirmLabel}
          </button>
        </div>
      </section>
    </div>
  );
};

export default ConfirmDeleteModal;
