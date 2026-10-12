// Tarjeta centrada para estados en los que la pantalla no puede mostrar su
// contenido normal (ej. "ya tenes equipo", "necesitas un perfil"), con una
// accion opcional para salir de ese estado.
function AvisoComponent({ titulo, children, accion }) {
  return (
    <div className="rounded-2xl border border-white/10 bg-ganker-surface p-6 text-center">
      <h2 className="font-heading text-xl font-semibold text-ganker-text">
        {titulo}
      </h2>
      {children && (
        <p className="mx-auto mt-2 max-w-md text-sm text-ganker-muted">
          {children}
        </p>
      )}
      {accion && <div className="mt-5">{accion}</div>}
    </div>
  );
}

export default AvisoComponent;
