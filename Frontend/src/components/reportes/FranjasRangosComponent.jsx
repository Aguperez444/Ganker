const CLASES_SELECT =
  "w-full rounded-lg border border-white/10 bg-ganker-surface-light px-3 py-2 text-sm text-ganker-text focus:border-ganker-purple focus:ring-2 focus:ring-ganker-purple focus:outline-none disabled:opacity-60";

// US 38 - Franjas de rangos definidas por el admin para el analisis de
// equipos de un videojuego (cada una va de un rango minimo a uno maximo).
// `rangos` viene ordenado de menor a mayor.
const FranjasRangosComponent = ({
  franjas,
  rangos,
  error,
  deshabilitado,
  onCambiar,
  onAgregar,
  onQuitar,
}) => (
  <fieldset>
    <legend className="mb-1 text-xs font-semibold text-ganker-text">
      Franjas de rangos
    </legend>
    <p className="mb-3 text-xs text-ganker-muted">
      Definí las franjas a comparar; no pueden solaparse.
    </p>

    {error && <p className="mb-3 text-sm text-ganker-error">{error}</p>}

    <ul className="space-y-2">
      {franjas.map((franja, indice) => {
        const numero = indice + 1;
        return (
          <li
            key={indice}
            className="grid items-end gap-2 sm:grid-cols-[minmax(0,1fr)_minmax(0,1fr)_auto]"
          >
            <div>
              <label
                htmlFor={`franja-${indice}-min`}
                className="mb-1 block text-xs text-ganker-muted"
              >
                Franja {numero}: desde
              </label>
              <select
                id={`franja-${indice}-min`}
                value={franja.min_rank_id}
                onChange={(e) =>
                  onCambiar(indice, "min_rank_id", e.target.value)
                }
                disabled={deshabilitado}
                className={CLASES_SELECT}
              >
                <option value="">Rango mínimo</option>
                {rangos.map((rango) => (
                  <option key={rango.rank_id} value={String(rango.rank_id)}>
                    {rango.name}
                  </option>
                ))}
              </select>
            </div>
            <div>
              <label
                htmlFor={`franja-${indice}-max`}
                className="mb-1 block text-xs text-ganker-muted"
              >
                Franja {numero}: hasta
              </label>
              <select
                id={`franja-${indice}-max`}
                value={franja.max_rank_id}
                onChange={(e) =>
                  onCambiar(indice, "max_rank_id", e.target.value)
                }
                disabled={deshabilitado}
                className={CLASES_SELECT}
              >
                <option value="">Rango máximo</option>
                {rangos.map((rango) => (
                  <option key={rango.rank_id} value={String(rango.rank_id)}>
                    {rango.name}
                  </option>
                ))}
              </select>
            </div>
            <button
              type="button"
              onClick={() => onQuitar(indice)}
              disabled={deshabilitado || franjas.length === 1}
              aria-label={`Quitar franja ${numero}`}
              className="cursor-pointer rounded-lg border border-ganker-error/40 px-3 py-2 text-sm font-semibold text-ganker-error transition hover:bg-ganker-error/10 disabled:cursor-not-allowed disabled:opacity-40"
            >
              Quitar
            </button>
          </li>
        );
      })}
    </ul>

    <button
      type="button"
      onClick={onAgregar}
      disabled={deshabilitado}
      className="mt-3 cursor-pointer rounded-lg border border-ganker-purple-light/40 px-3 py-1.5 text-sm font-semibold text-ganker-purple-light transition hover:bg-ganker-purple/20 hover:text-ganker-text disabled:cursor-not-allowed disabled:opacity-50"
    >
      + Agregar franja
    </button>
  </fieldset>
);

export default FranjasRangosComponent;
