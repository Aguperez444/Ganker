// Banner de aviso reutilizable: verde para éxito (role="status") y rojo para
// error (role="alert"). Se usa en la búsqueda de equipos y en "mi equipo".
function AvisoComponent({ aviso, onCerrar }) {
  if (!aviso) return null;

  const esExito = aviso.tipo === "exito";
  const borde = esExito
    ? "border-emerald-400/20 bg-emerald-400/10"
    : "border-ganker-error/20 bg-ganker-error/10";
  const texto = esExito ? "text-emerald-300" : "text-ganker-error";

  return (
    <div
      role={esExito ? "status" : "alert"}
      className={`flex items-start gap-3 rounded-lg border px-4 py-3 ${borde}`}
    >
      <p className={`text-sm ${texto}`}>{aviso.texto}</p>
      <button
        type="button"
        onClick={onCerrar}
        aria-label="Cerrar aviso"
        className="ml-auto shrink-0 cursor-pointer text-ganker-muted transition hover:text-ganker-text"
      >
        <svg
          viewBox="0 0 24 24"
          fill="none"
          stroke="currentColor"
          strokeWidth="2"
          className="h-4 w-4"
          aria-hidden="true"
        >
          <path d="M18 6 6 18M6 6l12 12" />
        </svg>
      </button>
    </div>
  );
}

export default AvisoComponent;
