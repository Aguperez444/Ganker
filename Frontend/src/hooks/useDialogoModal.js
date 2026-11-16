import { useEffect } from "react";

const CONTROLES =
  'button:not(:disabled), a[href], input:not(:disabled), select:not(:disabled), textarea:not(:disabled), iframe, [tabindex="0"]';

// Mantiene el teclado y el scroll dentro de la ventana activa.
export default function useDialogoModal({
  contenidoRef,
  onClose,
  bloqueado = false,
  paso,
}) {
  useEffect(() => {
    const focoAnterior = document.activeElement;
    const overflowAnterior = document.body.style.overflow;
    document.body.style.overflow = "hidden";
    contenidoRef.current?.querySelector(CONTROLES)?.focus();

    function manejarTecla(evento) {
      if (evento.key === "Escape" && !bloqueado) {
        evento.preventDefault();
        onClose();
      }
      if (evento.key !== "Tab") return;
      const controles = contenidoRef.current?.querySelectorAll(CONTROLES);
      if (!controles?.length) {
        evento.preventDefault();
        return;
      }
      const primero = controles[0];
      const ultimo = controles[controles.length - 1];
      if (evento.shiftKey && document.activeElement === primero) {
        evento.preventDefault();
        ultimo.focus();
      } else if (!evento.shiftKey && document.activeElement === ultimo) {
        evento.preventDefault();
        primero.focus();
      }
    }

    document.addEventListener("keydown", manejarTecla);
    return () => {
      document.removeEventListener("keydown", manejarTecla);
      document.body.style.overflow = overflowAnterior;
      focoAnterior?.focus();
    };
  }, [contenidoRef, onClose, bloqueado, paso]);
}
