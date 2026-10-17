import { useId, useState } from "react";
import { filtrarPorNombre } from "../../utils/busqueda";

// Campo para buscar por nombre arriba de una lista del admin (regiones, roles,
// personajes). La lista en si la sigue dibujando cada pagina con su propio
// componente: `children` es una funcion que recibe los elementos filtrados.
//
// El texto buscado vive aca adentro: la pagina lo monta con
// key={selectedGameId} para que se limpie al cambiar de videojuego.
//
// El campo solo aparece cuando hay algo para buscar (no mientras carga, ni si
// hubo error o la lista esta vacia: ahi se deja el mensaje de la lista).
const ListaConBuscadorComponent = ({
  items,
  isLoading,
  error,
  label,
  placeholder,
  children,
}) => {
  const [texto, setTexto] = useState("");
  const inputId = useId();

  const mostrarBuscador = !isLoading && !error && items.length > 0;
  const filtrados = mostrarBuscador ? filtrarPorNombre(items, texto) : items;
  const sinCoincidencias = mostrarBuscador && filtrados.length === 0;

  return (
    <div>
      {mostrarBuscador && (
        <div className="mb-4">
          <label htmlFor={inputId} className="sr-only">
            {label}
          </label>
          <div className="relative">
            <span
              aria-hidden="true"
              className="pointer-events-none absolute top-1/2 left-3 -translate-y-1/2 text-ganker-muted"
            >
              ⌕
            </span>
            <input
              id={inputId}
              type="search"
              value={texto}
              onChange={(e) => setTexto(e.target.value)}
              placeholder={placeholder}
              autoComplete="off"
              className="w-full rounded-lg border border-white/10 bg-ganker-surface-light py-2.5 pr-3 pl-9 text-sm text-ganker-text placeholder:text-ganker-muted focus:border-ganker-purple focus:ring-2 focus:ring-ganker-purple focus:outline-none"
            />
          </div>
          {texto.trim() && !sinCoincidencias && (
            <p className="mt-2 text-xs text-ganker-muted">
              {filtrados.length} de {items.length}
            </p>
          )}
        </div>
      )}

      {sinCoincidencias ? (
        <div className="rounded-xl border border-white/10 bg-ganker-surface-light p-6">
          <p className="text-sm text-ganker-muted">
            Ningún resultado coincide con &quot;{texto.trim()}&quot;.
          </p>
        </div>
      ) : (
        children(filtrados)
      )}
    </div>
  );
};

export default ListaConBuscadorComponent;
