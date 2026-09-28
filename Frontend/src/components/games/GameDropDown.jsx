import { useState, useRef, useEffect } from "react";
import { resolveIconUrl } from "../../utils/media";

const GameDropdown = ({ games, selectedGameId, onSelect, isLoading, disabled = false }) => {
  const [isOpen, setIsOpen] = useState(false);
  const dropdownRef = useRef(null);

  const selectedGame = games.find((g) => String(g.id) === String(selectedGameId));

  useEffect(() => {
    const handleClickOutside = (event) => {
      if (dropdownRef.current && !dropdownRef.current.contains(event.target)) {
        setIsOpen(false);
      }
    };
    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, []);

  return (
    <div className="relative w-full" ref={dropdownRef}>
      <button
        type="button"
        onClick={() => !isLoading && !disabled && setIsOpen(!isOpen)}
        disabled={isLoading || disabled}
        className={`flex w-full items-center justify-between rounded-lg border border-white/10 bg-ganker-surface-light px-4 py-2.5 text-sm text-ganker-text outline-none transition-all duration-200 ${
          disabled
            ? "cursor-not-allowed opacity-50 bg-white/5"
            : "focus:border-ganker-purple-light focus:ring-2 focus:ring-ganker-purple/30 cursor-pointer"
        }`}
      >
        <div className="flex items-center gap-3 truncate">
          {selectedGame ? (
            <>
              {resolveIconUrl(selectedGame.icon_url || selectedGame.logo_url) ? (
                <img
                  src={resolveIconUrl(selectedGame.icon_url || selectedGame.logo_url)}
                  alt={selectedGame.name}
                  className="h-6 w-6 shrink-0 rounded object-cover border border-white/10 bg-ganker-surface"
                  onError={(e) => {
                    e.currentTarget.style.display = "none";
                  }}
                />
              ) : (
                <div className="flex h-6 w-6 shrink-0 items-center justify-center rounded border border-white/10 bg-white/5 text-xs text-ganker-muted">
                  🎮
                </div>
              )}
              <span className="truncate">{selectedGame.name}</span>
            </>
          ) : (
            <span className="text-ganker-muted">Seleccioná un videojuego...</span>
          )}
        </div>

        {!disabled && (
          <svg
            className={`h-4 w-4 shrink-0 text-ganker-muted transition-transform duration-200 ${
              isOpen ? "rotate-180" : ""
            }`}
            fill="none"
            viewBox="0 0 24 24"
            stroke="currentColor"
          >
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
          </svg>
        )}
      </button>

      {isOpen && !disabled && (
        <div className="absolute left-0 right-0 z-50 mt-2 max-h-60 overflow-y-auto rounded-xl border border-white/10 bg-ganker-surface p-1 shadow-2xl backdrop-blur-md">
          <button
            type="button"
            onClick={() => {
              onSelect("");
              setIsOpen(false);
            }}
            className="flex w-full items-center gap-3 rounded-lg px-3 py-2 text-left text-sm text-ganker-muted transition hover:bg-white/5 hover:text-ganker-text cursor-pointer"
          >
            <span>Seleccioná un videojuego...</span>
          </button>

          {games.map((game) => {
            const isSelected = String(game.id) === String(selectedGameId);
            return (
              <button
                key={game.id}
                type="button"
                onClick={() => {
                  onSelect(game.id);
                  setIsOpen(false);
                }}
                className={`flex w-full items-center gap-3 rounded-lg px-3 py-2 text-left text-sm transition cursor-pointer ${
                  isSelected
                    ? "bg-ganker-purple/20 text-ganker-text font-medium"
                    : "text-ganker-muted hover:bg-white/5 hover:text-ganker-text"
                }`}
              >
                {resolveIconUrl(game.icon_url || game.logo_url) ? (
                  <img
                    src={resolveIconUrl(game.icon_url || game.logo_url)}
                    alt={game.name}
                    className="h-6 w-6 shrink-0 rounded object-cover border border-white/10 bg-ganker-surface"
                    onError={(e) => {
                      e.currentTarget.style.display = "none";
                    }}
                  />
                ) : (
                  <div className="flex h-6 w-6 shrink-0 items-center justify-center rounded border border-white/10 bg-white/5 text-xs text-ganker-muted">
                    🎮
                  </div>
                )}
                <span className="truncate">{game.name}</span>
              </button>
            );
          })}
        </div>
      )}
    </div>
  );
};

export default GameDropdown;