import { useId, useRef } from "react";
import { createPortal } from "react-dom";
import useDialogoModal from "../../hooks/useDialogoModal";

export default function ModalModeracionComponent({
  titulo,
  subtitulo,
  onClose,
  cerrarLabel = "Cerrar",
  bloqueado = false,
  children,
}) {
  const tituloId = useId();
  const contenidoRef = useRef(null);

  useDialogoModal({ contenidoRef, onClose, bloqueado });

  return createPortal(
    <div
      className="fixed inset-0 z-50 flex items-center justify-center bg-black/80 p-4 backdrop-blur-sm"
      onClick={(evento) => {
        if (evento.target === evento.currentTarget && !bloqueado) onClose();
      }}
    >
      <section
        ref={contenidoRef}
        role="dialog"
        aria-modal="true"
        aria-labelledby={tituloId}
        className="max-h-[90dvh] w-full max-w-3xl overflow-y-auto rounded-2xl border border-white/10 bg-ganker-surface shadow-2xl"
      >
        <header className="sticky top-0 z-10 flex items-center justify-between gap-4 border-b border-white/10 bg-ganker-surface p-5 sm:px-6">
          <div>
            {subtitulo && (
              <p className="text-xs font-semibold text-ganker-purple-light">
                {subtitulo}
              </p>
            )}
            <h2
              id={tituloId}
              className="mt-1 font-heading text-xl font-bold text-ganker-text"
            >
              {titulo}
            </h2>
          </div>
          <button
            type="button"
            disabled={bloqueado}
            onClick={onClose}
            aria-label={cerrarLabel}
            className="cursor-pointer rounded-lg border border-white/10 px-3 py-2 text-sm text-ganker-text transition hover:bg-white/5 focus-visible:outline-2 focus-visible:outline-ganker-purple-light"
          >
            {cerrarLabel.startsWith("Volver") ? "Volver" : "Cerrar"}
          </button>
        </header>
        {children}
      </section>
    </div>,
    document.body
  );
}
