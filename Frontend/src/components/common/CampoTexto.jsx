function CampoTexto({ label, icono, error, extra, ...props }) {
  return (
    <div>
      <label className="mb-1 block text-xs font-semibold tracking-wide text-ganker-text font-body">
        {label}
      </label>
      <div className="relative">
        {icono && (
          <span className="pointer-events-none absolute left-3 top-1/2 -translate-y-1/2 text-ganker-muted">
            {icono}
          </span>
        )}
        <input
          className={`w-full rounded-lg border bg-ganker-surface py-2.5 text-sm text-ganker-text font-body
            placeholder:text-ganker-muted focus:outline-none focus:ring-2 focus:ring-ganker-purple
            ${icono ? "pl-9" : "pl-3"} ${extra ? "pr-9" : "pr-3"}
            ${error ? "border-ganker-error" : "border-ganker-purple"}`}
          {...props}
        />
        {extra}
      </div>
      {error && <p className="mt-1 text-xs text-ganker-error">{error}</p>}
    </div>
  );
}

export default CampoTexto;