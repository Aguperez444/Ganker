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

// Check gris = enviado, doble check violeta = leido.
const IndicadorLeido = ({ leido }) => (
  <span
    aria-label={leido ? "Leído" : "Enviado"}
    title={leido ? "Leído" : "Enviado"}
    className={`text-xs leading-none ${leido ? "text-ganker-purple" : "text-ganker-muted"}`}
  >
    {leido ? "✓✓" : "✓"}
  </span>
);

// mostrarHora/mostrarIndicadorLeido los calcula ChatWindowComponent, que es
// quien conoce el resto de la lista (agrupar por minuto y el check en
// cascada necesitan saber que viene antes/despues de este mensaje).
const MessageBubbleComponent = ({
  mensaje,
  esPropio,
  mostrarHora = true,
  mostrarIndicadorLeido = esPropio,
}) => {
  const indicadorLeido = esPropio && mostrarIndicadorLeido;

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
      {(mostrarHora || indicadorLeido) && (
        <span className="mt-1 flex items-center gap-1 text-[11px] text-ganker-muted">
          {mostrarHora && formatearFechaMensaje(mensaje.timestamp)}
          {indicadorLeido && <IndicadorLeido leido={mensaje.is_read} />}
        </span>
      )}
    </div>
  );
};

export default MessageBubbleComponent;
