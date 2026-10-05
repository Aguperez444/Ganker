import { useEffect } from "react";

const ModalConfirmacionComponent = ({
  isOpen,
  title,
  message,
  confirmLabel = "Confirmar",
  isLoading = false,
  error = "",
  onConfirm,
  onCancel,
}) => {
  // Cerrar con tecla Escape (salvo que se esté procesando la acción)
  useEffect(() => {
    if (!isOpen) return;

    function handleKeyDown(e) {
      if (e.key === "Escape" && !isLoading) {
        onCancel();
      }
    }

    window.addEventListener("keydown", handleKeyDown);
    return () => window.removeEventListener("keydown", handleKeyDown);
  }, [isOpen, isLoading, onCancel]);

  if (!isOpen) return null;

  return (
    <div
      role="dialog"
      aria-modal="true"
      aria-labelledby="titulo-modal-confirmacion"
      className="fixed inset-0 z-50 flex items-center justify-center bg-black/80 p-4 backdrop-blur-sm"
    >
      <div className="w-full max-w-md space-y-4 rounded-2xl border border-white/10 bg-ganker-surface p-6 shadow-2xl">
        <h3
          id="titulo-modal-confirmacion"
          className="font-heading text-lg font-bold text-ganker-text"
        >
          {title}
        </h3>

        <div className="text-sm text-ganker-muted">{message}</div>

        {error && (
          <div className="rounded-lg border border-ganker-error/20 bg-ganker-error/10 px-4 py-3">
            <p className="text-sm text-ganker-error">{error}</p>
          </div>
        )}

        <div className="flex justify-end gap-3">
          <button
            type="button"
            onClick={onCancel}
            disabled={isLoading}
            className="cursor-pointer rounded-lg border border-white/10 px-4 py-2.5 text-sm font-semibold text-ganker-muted transition hover:bg-white/5 hover:text-ganker-text disabled:cursor-not-allowed disabled:opacity-50"
          >
            Cancelar
          </button>

          <button
            type="button"
            onClick={onConfirm}
            disabled={isLoading}
            className="cursor-pointer rounded-lg bg-ganker-error px-4 py-2.5 text-sm font-semibold text-white transition hover:bg-ganker-error/80 disabled:cursor-not-allowed disabled:opacity-50"
          >
            {isLoading ? "Procesando..." : confirmLabel}
          </button>
        </div>
      </div>
    </div>
  );
};

export default ModalConfirmacionComponent;
