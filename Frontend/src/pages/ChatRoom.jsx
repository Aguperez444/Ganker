// src/pages/ChatRoom.jsx
import React, { useState, useEffect, useRef } from "react";
import { useParams, useNavigate, Link } from "react-router-dom";
import useChatSocket from "../hooks/useChatSocket";

/**
 * ChatRoom – UI de chat en tiempo real para un equipo.
 * URL: /app/chat/:conversationId
 * Usa el hook `useChatSocket` que ya valida token, membresía y estado del equipo.
 */
export default function ChatRoom() {
  const { conversationId } = useParams();
  const navigate = useNavigate();
  const [input, setInput] = useState("");
  const [localError, setLocalError] = useState(null);

  const { mensajes, estado, error, enviarMensaje } = useChatSocket(
    conversationId,
    [],
    () => {}
  );

  const messagesEndRef = useRef(null);
  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [mensajes]);

  const handleSend = () => {
    const trimmed = input.trim();
    if (!trimmed) {
      setLocalError("El mensaje no puede estar vacío.");
      return;
    }
    const ok = enviarMensaje(trimmed);
    if (!ok) {
      setLocalError(error || "No se pudo enviar el mensaje.");
    } else {
      setInput("");
      setLocalError(null);
    }
  };

  // Redirigir si hay error de permiso o conexión
  useEffect(() => {
    if (estado === "ERROR" && error) {
      setTimeout(() => navigate("/app"), 3000);
    }
  }, [estado, error, navigate]);

  return (
    <section className="min-h-full bg-ganker-bg px-4 py-6 sm:px-6 lg:px-8">
      <div className="mx-auto w-full max-w-3xl space-y-4">
        <header className="rounded-2xl border border-white/10 bg-ganker-surface p-6 sm:p-8 flex items-center justify-between">
          <h2 className="font-heading text-2xl font-bold text-ganker-text">Chat de equipo</h2>
          <Link to="/app" className="text-sm font-semibold text-ganker-purple hover:underline">
            ← Volver al inicio
          </Link>
        </header>

        <div className="rounded-2xl border border-white/10 bg-ganker-surface p-4 overflow-y-auto max-h-96">
          {mensajes.map((msg, idx) => (
            <div key={msg.message_id || idx} className="mb-3">
              <strong className="text-ganker-text">{msg.sender_name || "Usuario"}:</strong> {msg.content}
              <div className="text-xs text-ganker-muted">
                {new Date(msg.created_at).toLocaleTimeString()}
              </div>
            </div>
          ))}
          <div ref={messagesEndRef} />
        </div>

        <div className="flex space-x-2">
          <input
            type="text"
            value={input}
            maxLength={2000}
            placeholder="Escribe tu mensaje..."
            onChange={(e) => setInput(e.target.value)}
            onKeyDown={(e) => e.key === "Enter" && (e.preventDefault(), handleSend())}
            className="flex-1 rounded-xl border border-white/10 bg-ganker-surface-light px-4 py-2.5 text-sm text-ganker-text placeholder:ganker-muted"
          />
          <button
            onClick={handleSend}
            className="rounded-xl bg-ganker-purple px-4 py-2.5 text-sm font-semibold text-white hover:bg-ganker-purple/80"
          >
            Enviar
          </button>
        </div>

        {(error || localError) && (
          <p className="mt-2 text-sm text-red-500">{error || localError}</p>
        )}
      </div>
    </section>
  );
}
