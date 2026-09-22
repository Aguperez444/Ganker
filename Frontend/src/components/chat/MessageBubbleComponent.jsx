function formatearFechaMensaje(timestamp) {
  const fecha = new Date(timestamp);
  if (Number.isNaN(fecha.getTime())) return "";

  const ahora = new Date();
  const hora = fecha.toLocaleTimeString([], {
    hour: "2-digit",
    minute: "2-digit",
  });

  const esHoy =
    fecha.getDate() === ahora.getDate() &&
    fecha.getMonth() === ahora.getMonth() &&
    fecha.getFullYear() === ahora.getFullYear();

  if (esHoy) return hora;

  const fechaCorta = fecha.toLocaleDateString([], {
    day: "2-digit",
    month: "2-digit",
  });
  return `${fechaCorta} ${hora}`;
}

// US 10 - Los mensajes propios van a la derecha, los del otro jugador a la
// izquierda. `esPropio` lo decide quien use este componente comparando
// mensaje.sender_id contra el id del usuario logueado.
const MessageBubbleComponent = ({ mensaje, esPropio }) => {
  return (
    <div className={`flex flex-col ${esPropio ? "items-end" : "items-start"}`}>
      <div
        className={`max-w-[75%] rounded-2xl px-4 py-2.5 text-sm break-words ${
          esPropio
            ? "rounded-br-sm bg-gradient-to-r from-ganker-orange to-ganker-purple text-white"
            : "rounded-bl-sm border border-white/10 bg-ganker-surface-light text-ganker-text"
        }`}
      >
        {mensaje.content}
      </div>
      <span className="mt-1 text-[11px] text-ganker-muted">
        {formatearFechaMensaje(mensaje.timestamp)}
      </span>
    </div>
  );
};

export default MessageBubbleComponent;
