import { urlDeMedia } from "../../utils/media";

// Selector de videojuego para buscadores y filtros: en vez de un desplegable,
// muestra siempre todos los juegos con su icono y se elige con un click.
// Accesible como radiogroup (`etiqueta` es su nombre; cada juego, un radio),
// asi que tambien se recorre con Tab y se elige con Enter/Espacio.
//
// `opcionTodos`: texto de una primera opcion que llama a onChange("") (ej.
// "Todos" en el reporte de uso). `value` y lo que recibe onChange son strings,
// igual que en IconSelectComponent, para no cambiar a quien lo usa.
function SelectorJuegoComponent({
  etiqueta,
  juegos,
  value,
  onChange,
  disabled = false,
  opcionTodos = null,
  getOptionId = (juego) => juego.id,
}) {
  const opciones = [
    ...(opcionTodos ? [{ id: "", nombre: opcionTodos, icono: null }] : []),
    ...juegos.map((juego) => ({
      id: String(getOptionId(juego)),
      nombre: juego.name,
      icono: urlDeMedia(juego.icon_url),
    })),
  ];

  return (
    <div
      role="radiogroup"
      aria-label={etiqueta}
      aria-disabled={disabled || undefined}
      className="flex flex-wrap gap-2"
    >
      {opciones.map((opcion) => {
        const seleccionado = String(value ?? "") === opcion.id;
        return (
          <button
            key={opcion.id || "todos"}
            type="button"
            role="radio"
            aria-checked={seleccionado}
            disabled={disabled}
            onClick={() => onChange(opcion.id)}
            className={`group flex items-center gap-2 rounded-xl border px-3 py-2 text-sm font-semibold transition duration-150 disabled:cursor-not-allowed disabled:opacity-60 ${
              seleccionado
                ? "border-ganker-purple-light bg-ganker-purple/25 text-ganker-text shadow-[0_0_12px] shadow-ganker-purple/40"
                : "border-white/10 bg-ganker-surface-light text-ganker-muted hover:border-ganker-purple-light/50 hover:text-ganker-text"
            }`}
          >
            {opcion.icono ? (
              <img
                src={opcion.icono}
                alt=""
                aria-hidden="true"
                className={`h-7 w-7 shrink-0 rounded-lg object-contain transition ${
                  seleccionado ? "" : "opacity-80 group-hover:opacity-100"
                }`}
                onError={(e) => {
                  e.currentTarget.style.display = "none";
                }}
              />
            ) : (
              <span
                aria-hidden="true"
                className="flex h-7 w-7 shrink-0 items-center justify-center rounded-lg bg-ganker-surface text-xs text-ganker-purple-light"
              >
                {opcion.id ? opcion.nombre.charAt(0).toUpperCase() : "∗"}
              </span>
            )}
            <span className="whitespace-nowrap">{opcion.nombre}</span>
          </button>
        );
      })}
    </div>
  );
}

export default SelectorJuegoComponent;
