import { useState } from "react";

/**
 * US 10 - Campo para escribir y enviar un mensaje. Enter envia, Shift+Enter
 * no (por si en el futuro se permite texto multilinea).
 */
const MessageInputComponent = ({ onEnviar, deshabilitado }) => {
  const [texto, setTexto] = useState("");

  function enviar() {
    if (!texto.trim() || deshabilitado) return;
    if (onEnviar(texto) !== false) {
      setTexto("");
    }
  }

  function handleSubmit(e) {
    e.preventDefault();
    enviar();
  }

  function handleKeyDown(e) {
    if (e.key === "Enter" && !e.shiftKey) {
      e.preventDefault();
      enviar();
    }
  }

  return (
    <form
      onSubmit={handleSubmit}
      className="flex gap-2 border-t border-white/10 bg-ganker-surface px-4 py-3 sm:px-6"
    >
      <input
        type="text"
        value={texto}
        maxLength={2000}
        disabled={deshabilitado}
        onChange={(e) => setTexto(e.target.value)}
        onKeyDown={handleKeyDown}
        placeholder={deshabilitado ? "Conectando..." : "Escribí un mensaje..."}
        className="flex-1 rounded-xl border border-white/10 bg-ganker-input px-4 py-2.5 text-sm text-ganker-text placeholder:text-ganker-muted focus:border-ganker-purple/40 focus:outline-none disabled:opacity-60"
      />
      <button
        type="submit"
        disabled={deshabilitado || !texto.trim()}
        className="shrink-0 rounded-xl bg-gradient-to-r from-ganker-orange to-ganker-purple px-4 py-2.5 text-sm font-semibold text-white transition hover:opacity-90 disabled:cursor-not-allowed disabled:opacity-50"
      >
        Enviar
      </button>
    </form>
  );
};

export default MessageInputComponent;
