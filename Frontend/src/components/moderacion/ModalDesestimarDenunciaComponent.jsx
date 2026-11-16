import { useState } from "react";
import { desestimarDenuncia } from "../../api/moderacionApi";
import ModalModeracionComponent from "./ModalModeracionComponent";

export default function ModalDesestimarDenunciaComponent({
  denuncia,
  onClose,
  onDesestimada,
}) {
  const [enviando, setEnviando] = useState(false);
  const [error, setError] = useState("");

  async function confirmar() {
    if (enviando) return;
    setEnviando(true);
    setError("");
    try {
      await desestimarDenuncia(denuncia.id);
      onDesestimada();
    } catch (fallo) {
      setError(
        fallo.response?.data?.error ||
          "No se pudo desestimar la denuncia. Probá de nuevo."
      );
    } finally {
      setEnviando(false);
    }
  }

  return (
    <ModalModeracionComponent
      titulo="Desestimar denuncia"
      subtitulo={`Reporte #${denuncia.id}`}
      onClose={onClose}
      bloqueado={enviando}
    >
      <div className="space-y-4 p-5 sm:p-6">
        <p className="text-sm text-ganker-text">
          Se cerrará la denuncia de{" "}
          <strong>@{denuncia.reporter_user_name}</strong> contra{" "}
          <strong>@{denuncia.reported_user_name}</strong> sin banear al jugador.
        </p>
        <p className="text-sm text-ganker-muted">
          Usá esta opción si el motivo o la evidencia no justifican una sanción.
          La decisión quedará registrada y la denuncia no podrá volver a usarse
          para aplicar un baneo.
        </p>
        {error && (
          <p role="alert" className="text-sm text-ganker-error">
            {error}
          </p>
        )}
        <div className="flex flex-wrap justify-end gap-3">
          <button
            type="button"
            onClick={onClose}
            disabled={enviando}
            className="cursor-pointer rounded-lg border border-white/10 px-4 py-2.5 text-sm text-ganker-muted"
          >
            Cancelar
          </button>
          <button
            type="button"
            onClick={confirmar}
            disabled={enviando}
            className="cursor-pointer rounded-lg bg-ganker-purple px-4 py-2.5 text-sm font-semibold text-white disabled:opacity-50"
          >
            {enviando ? "Guardando..." : "Confirmar desestimación"}
          </button>
        </div>
      </div>
    </ModalModeracionComponent>
  );
}
