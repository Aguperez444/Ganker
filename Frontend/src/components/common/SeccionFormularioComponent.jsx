// Agrupa campos relacionados de un formulario largo bajo un titulo. Es un
// fieldset para que los lectores de pantalla anuncien el grupo.
function SeccionFormularioComponent({ titulo, descripcion, children }) {
  return (
    <fieldset className="space-y-4 border-t border-white/10 pt-6 first:border-t-0 first:pt-0">
      <legend className="sr-only">{titulo}</legend>
      <div>
        <h2 className="font-heading text-lg font-semibold text-ganker-text">
          {titulo}
        </h2>
        {descripcion && (
          <p className="mt-1 text-sm text-ganker-muted">{descripcion}</p>
        )}
      </div>
      {children}
    </fieldset>
  );
}

export default SeccionFormularioComponent;
