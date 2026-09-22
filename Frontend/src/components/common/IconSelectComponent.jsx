import { useEffect, useRef, useState } from "react";
import { urlDeMedia } from "../../utils/media";

// Select con icono por opcion. Existe porque un <select> nativo no puede
// mostrar imagenes dentro de sus <option> en ningun navegador — no es una
// limitacion de estilos, es del elemento en si. Se usa donde antes habia un
// <select> plano para personajes/rangos, para poder mostrar su icono.
//
// El cierre al hacer click afuera sigue el mismo patron que el menu de
// usuario en TopNavbar.jsx (ref + listener de mousedown en el documento).
//
// `buscable`: agrega un campo de texto arriba de la lista para filtrarla
// escribiendo. Pensado para catalogos que pueden crecer mucho (personajes:
// un juego puede tener decenas), no hace falta en selects cortos como
// rango/rol/videojuego.
//
// `incluirOpcionCualquiera`: agrega una primera opcion fija ("Cualquiera")
// que llama a onChange("") para volver a "sin filtro" sin tener que usar
// el boton de limpiar todos los filtros. Pensada para selects de filtro
// (Buscar jugadores), no para selects que agregan a una lista (personajes
// de un perfil de juego).
function IconSelectComponent({
  value,
  onChange,
  options,
  placeholder = "Selecciona...",
  disabled = false,
  buscable = false,
  incluirOpcionCualquiera = false,
  getOptionId = (option) => option.id,
  getOptionLabel = (option) => option.name,
  getOptionIcon = (option) => option.icon_url,
}) {
  const [isOpen, setIsOpen] = useState(false);
  const [busqueda, setBusqueda] = useState("");
  const containerRef = useRef(null);
  const inputBusquedaRef = useRef(null);

  // Cierra y limpia la busqueda juntos: asi la proxima vez que se abra
  // arranca en blanco, sin necesitar un efecto aparte que resetee
  // `busqueda` cuando `isOpen` pase a false (eso dispara la regla
  // set-state-in-effect, ver hooks/useGames.js para el mismo caso).
  const cerrar = () => {
    setIsOpen(false);
    setBusqueda("");
  };

  useEffect(() => {
    if (!isOpen) return;

    function handleClickOutside(event) {
      if (
        containerRef.current &&
        !containerRef.current.contains(event.target)
      ) {
        cerrar();
      }
    }

    function handleEscape(event) {
      if (event.key === "Escape") cerrar();
    }

    document.addEventListener("mousedown", handleClickOutside);
    document.addEventListener("keydown", handleEscape);
    return () => {
      document.removeEventListener("mousedown", handleClickOutside);
      document.removeEventListener("keydown", handleEscape);
    };
  }, [isOpen]);

  useEffect(() => {
    if (isOpen && buscable) {
      inputBusquedaRef.current?.focus();
    }
  }, [isOpen, buscable]);

  const selectedOption = options.find(
    (option) => String(getOptionId(option)) === String(value)
  );

  const opcionesFiltradas = buscable
    ? options.filter((option) =>
        getOptionLabel(option)
          .toLowerCase()
          .includes(busqueda.trim().toLowerCase())
      )
    : options;

  const renderIcon = (option) => {
    const iconUrl = option && urlDeMedia(getOptionIcon(option));

    if (iconUrl) {
      return (
        <img
          src={iconUrl}
          alt=""
          className="h-6 w-6 shrink-0 rounded object-cover"
          onError={(e) => {
            e.currentTarget.style.display = "none";
          }}
        />
      );
    }

    return (
      <span className="flex h-6 w-6 shrink-0 items-center justify-center rounded bg-ganker-surface text-[10px] font-semibold text-ganker-purple-light">
        {option ? getOptionLabel(option).charAt(0).toUpperCase() : ""}
      </span>
    );
  };

  return (
    <div className="relative" ref={containerRef}>
      <button
        type="button"
        onClick={() => !disabled && (isOpen ? cerrar() : setIsOpen(true))}
        disabled={disabled}
        className="flex w-full items-center gap-2 rounded-xl border border-white/10 bg-ganker-surface-light px-4 py-3 text-left text-sm text-ganker-text outline-none transition focus:border-ganker-purple-light disabled:cursor-not-allowed disabled:opacity-60"
      >
        {selectedOption ? (
          <>
            {renderIcon(selectedOption)}
            <span className="truncate">{getOptionLabel(selectedOption)}</span>
          </>
        ) : (
          <span className="truncate text-ganker-muted">{placeholder}</span>
        )}

        <svg
          className={`ml-auto h-4 w-4 shrink-0 text-ganker-muted transition-transform ${
            isOpen ? "rotate-180" : ""
          }`}
          viewBox="0 0 24 24"
          fill="none"
          stroke="currentColor"
          strokeWidth="1.8"
          aria-hidden="true"
        >
          <path d="m6 9 6 6 6-6" />
        </svg>
      </button>

      {isOpen && (
        <div className="absolute z-20 mt-1 w-full overflow-hidden rounded-xl border border-white/10 bg-ganker-surface shadow-2xl">
          {buscable && (
            <div className="border-b border-white/10 p-2">
              <input
                ref={inputBusquedaRef}
                type="text"
                value={busqueda}
                onChange={(e) => setBusqueda(e.target.value)}
                placeholder="Buscar..."
                className="w-full rounded-lg bg-ganker-bg px-3 py-2 text-sm text-ganker-text placeholder:text-ganker-muted focus:outline-none"
              />
            </div>
          )}

          {/* max-h-64 + overflow-auto: listas cortas ocupan solo lo que
              necesitan, listas largas (ej. personajes de un juego con
              muchos) quedan acotadas y con scroll en vez de desbordar la
              pantalla. */}
          <ul className="max-h-64 overflow-auto">
            {incluirOpcionCualquiera && (
              <li>
                <button
                  type="button"
                  onClick={() => {
                    onChange("");
                    cerrar();
                  }}
                  className={`flex w-full items-center gap-2 border-b border-white/5 px-4 py-2.5 text-left text-sm transition hover:bg-white/5 ${
                    !value
                      ? "bg-ganker-purple/20 text-ganker-text"
                      : "text-ganker-muted"
                  }`}
                >
                  <span className="flex h-6 w-6 shrink-0 items-center justify-center rounded bg-ganker-surface text-xs text-ganker-purple-light">
                    ∅
                  </span>
                  <span className="truncate">Cualquiera</span>
                </button>
              </li>
            )}

            {opcionesFiltradas.length === 0 && (
              <li className="px-4 py-3 text-sm text-ganker-muted">
                {buscable && busqueda.trim()
                  ? "Sin coincidencias."
                  : "No hay opciones disponibles."}
              </li>
            )}

            {opcionesFiltradas.map((option) => {
              const optionId = getOptionId(option);
              const isSelected = String(optionId) === String(value);

              return (
                <li key={optionId}>
                  <button
                    type="button"
                    onClick={() => {
                      onChange(String(optionId));
                      cerrar();
                    }}
                    className={`flex w-full items-center gap-2 px-4 py-2.5 text-left text-sm transition hover:bg-white/5 ${
                      isSelected
                        ? "bg-ganker-purple/20 text-ganker-text"
                        : "text-ganker-text"
                    }`}
                  >
                    {renderIcon(option)}
                    <span className="truncate">{getOptionLabel(option)}</span>
                  </button>
                </li>
              );
            })}
          </ul>
        </div>
      )}
    </div>
  );
}

export default IconSelectComponent;
