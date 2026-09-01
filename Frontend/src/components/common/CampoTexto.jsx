function CampoTexto({ label, icono, error, extra, ...props }) {
  return (
    <div>
      <label className="mb-1 block text-xs font-semibold tracking-wide text-text-primary font-body">
        {label}
      </label>
      <div className="relative">
        {icono && (
          <span className="pointer-events-none absolute left-3 top-1/2 -translate-y-1/2 text-text-secondary">
            {icono}
          </span>
        )}
        <input
          className={`w-full rounded-lg border bg-secondary py-2.5 text-sm text-[#f4f2f5] font-body
            placeholder:text-text-secondary focus:outline-none focus:ring-2 focus:ring-violet-500
            ${icono ? "pl-9" : "pl-3"} ${extra ? "pr-9" : "pr-3"}
            ${error ? "border-error" : "border-tertiary"}`}
          // text-[#f4f2f5]: crema pedido, todavia sin token real (confirmar con el equipo)
          // focus:ring-violet-500: sin token de acento para el foco todavia
          {...props}
        />
        {extra}
      </div>
      {error && <p className="mt-1 text-xs text-error">{error}</p>}
    </div>
  );
}

export default CampoTexto;