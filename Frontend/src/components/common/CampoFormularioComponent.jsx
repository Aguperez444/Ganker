// Envoltorio de un control de formulario (select, textarea, input) con su
// label asociado por `id`, marca de obligatorio, texto de ayuda y error.
// A diferencia de CampoTexto, no impone el control: lo recibe como children.
function CampoFormularioComponent({
  id,
  label,
  obligatorio = false,
  error,
  ayuda,
  children,
}) {
  return (
    <div>
      <label
        htmlFor={id}
        className="mb-2 block text-sm font-medium text-ganker-text"
      >
        {label} {obligatorio && <span className="text-ganker-orange">*</span>}
      </label>
      {children}
      {ayuda && !error && (
        <p className="mt-1 text-xs text-ganker-muted">{ayuda}</p>
      )}
      {error && <p className="mt-1 text-xs text-ganker-error">{error}</p>}
    </div>
  );
}

export default CampoFormularioComponent;
