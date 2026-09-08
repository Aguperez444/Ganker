import { useEffect, useRef, useState } from "react";
import { urlDeMedia } from "../../utils/media";

// Select con icono por opcion. Existe porque un <select> nativo no puede
// mostrar imagenes dentro de sus <option> en ningun navegador — no es una
// limitacion de estilos, es del elemento en si. Se usa donde antes habia un
// <select> plano para personajes/rangos, para poder mostrar su icono.
//
// El cierre al hacer click afuera sigue el mismo patron que el menu de
// usuario en TopNavbar.jsx (ref + listener de mousedown en el documento).
function IconSelectComponent({
  value,
  onChange,
  options,
  placeholder = "Selecciona...",
  disabled = false,
  getOptionId = (option) => option.id,
  getOptionLabel = (option) => option.name,
  getOptionIcon = (option) => option.icon_url,
}) {
  const [isOpen, setIsOpen] = useState(false);
  const containerRef = useRef(null);

  useEffect(() => {
    if (!isOpen) return;

    function handleClickOutside(event) {
      if (containerRef.current && !containerRef.current.contains(event.target)) {
        setIsOpen(false);
      }
    }

    function handleEscape(event) {
      if (event.key === "Escape") setIsOpen(false);
    }

    document.addEventListener("mousedown", handleClickOutside);
    document.addEventListener("keydown", handleEscape);
    return () => {
      document.removeEventListener("mousedown", handleClickOutside);
      document.removeEventListener("keydown", handleEscape);
    };
  }, [isOpen]);

  const selectedOption = options.find(
    (option) => String(getOptionId(option)) === String(value)
  );

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
        onClick={() => !disabled && setIsOpen((prev) => !prev)}
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
        <ul className="absolute z-20 mt-1 max-h-64 w-full overflow-auto rounded-xl border border-white/10 bg-ganker-surface shadow-2xl">
          {options.length === 0 && (
            <li className="px-4 py-3 text-sm text-ganker-muted">
              No hay opciones disponibles.
            </li>
          )}

          {options.map((option) => {
            const optionId = getOptionId(option);
            const isSelected = String(optionId) === String(value);

            return (
              <li key={optionId}>
                <button
                  type="button"
                  onClick={() => {
                    onChange(String(optionId));
                    setIsOpen(false);
                  }}
                  className={`flex w-full items-center gap-2 px-4 py-2.5 text-left text-sm transition hover:bg-white/5 ${
                    isSelected ? "bg-ganker-purple/20 text-ganker-text" : "text-ganker-text"
                  }`}
                >
                  {renderIcon(option)}
                  <span className="truncate">{getOptionLabel(option)}</span>
                </button>
              </li>
            );
          })}
        </ul>
      )}
    </div>
  );
}

export default IconSelectComponent;
