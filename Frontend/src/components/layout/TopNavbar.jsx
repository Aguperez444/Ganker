import { useState, useRef, useEffect } from "react";
import { Link, useNavigate } from "react-router-dom";
import { useAuth } from "../../context/AuthContext";

const TopNavbar = ({ onOpenMenu, onOpenChat, showChatButton = true }) => {
  const { user, logout } = useAuth();
  const navigate = useNavigate();
  const [isUserMenuOpen, setIsUserMenuOpen] = useState(false);
  const userMenuRef = useRef(null);

  useEffect(() => {
    function handleClickOutside(event) {
      if (userMenuRef.current && !userMenuRef.current.contains(event.target)) {
        setIsUserMenuOpen(false);
      }
    }
    document.addEventListener("mousedown", handleClickOutside);
    return () => {
      document.removeEventListener("mousedown", handleClickOutside);
    };
  }, []);

  const handleLogout = () => {
    setIsUserMenuOpen(false);
    navigate("/", { replace: true });
    logout();
  };

  return (
    <header className="flex min-h-17 items-center border-b border-white/10 bg-ganker-surface px-4 sm:px-5">
      <div className="flex min-w-0 flex-1 items-center gap-3">
        {/* Menú mobile */}
        <button
          type="button"
          onClick={onOpenMenu}
          aria-label="Abrir menú"
          className="flex h-10 w-10 shrink-0 cursor-pointer items-center justify-center rounded-lg text-ganker-muted transition hover:bg-ganker-surface-light hover:text-ganker-text lg:hidden"
        >
          <svg
            viewBox="0 0 24 24"
            fill="none"
            stroke="currentColor"
            strokeWidth="1.8"
            className="h-6 w-6"
            aria-hidden="true"
          >
            <path d="M4 7h16" />
            <path d="M4 12h16" />
            <path d="M4 17h16" />
          </svg>
        </button>

        {/* Selector de juego */}
        <div className="flex min-w-0 items-center gap-3">
          <span className="hidden text-xs font-semibold tracking-[0.18em] text-ganker-muted uppercase xl:block">
            Mis juegos
          </span>

          <button
            type="button"
            className="flex min-w-0 cursor-pointer items-center gap-2 rounded-lg border border-white/10 bg-ganker-bg/30 px-3 py-2 text-sm font-semibold text-ganker-text transition hover:border-ganker-purple/40 hover:bg-ganker-surface-light"
          >
            <span className="truncate">Juego</span>

            <svg
              viewBox="0 0 24 24"
              fill="none"
              stroke="currentColor"
              strokeWidth="1.8"
              className="h-4 w-4 shrink-0 text-ganker-muted"
              aria-hidden="true"
            >
              <path d="m6 9 6 6 6-6" />
            </svg>
          </button>
        </div>
      </div>

      <div className="ml-3 flex shrink-0 items-center gap-2">
        {/* Chat tablet/mobile */}
        {showChatButton && (
          <button
            type="button"
            onClick={onOpenChat}
            aria-label="Abrir conversaciones"
            className="flex h-10 w-10 cursor-pointer items-center justify-center rounded-lg text-ganker-muted transition hover:bg-ganker-surface-light hover:text-ganker-text xl:hidden"
          >
            <svg
              viewBox="0 0 24 24"
              fill="none"
              stroke="currentColor"
              strokeWidth="1.8"
              className="h-5 w-5"
              aria-hidden="true"
            >
              <path d="M21 15a4 4 0 0 1-4 4H8l-5 3V7a4 4 0 0 1 4-4h10a4 4 0 0 1 4 4Z" />
            </svg>
          </button>
        )}

        {/* Usuario */}
        <div className="relative" ref={userMenuRef}>
          <button
            type="button"
            onClick={() => setIsUserMenuOpen((prev) => !prev)}
            aria-label="Abrir cuenta"
            className="flex h-10 w-10 cursor-pointer items-center justify-center rounded-full border border-ganker-purple/40 bg-ganker-surface-light text-sm font-semibold text-ganker-text transition hover:border-ganker-purple-light"
          >
            {user?.email ? user.email.charAt(0).toUpperCase() : "G"}
          </button>

          {isUserMenuOpen && (
            <div className="absolute right-0 mt-2 w-48 rounded-xl border border-white/10 bg-ganker-surface p-2 shadow-2xl z-50">
              {user?.email && (
                <div className="px-3 py-2 border-b border-white/10 text-xs text-ganker-muted truncate">
                  {user.email}
                </div>
              )}
              <Link
                to="/"
                onClick={() => setIsUserMenuOpen(false)}
                className="block rounded-lg px-3 py-2 text-xs font-semibold text-ganker-muted hover:bg-ganker-surface-light hover:text-ganker-text transition"
              >
                Página principal
              </Link>
              <button
                type="button"
                onClick={handleLogout}
                className="w-full text-left rounded-lg px-3 py-2 text-xs font-semibold text-ganker-error hover:bg-ganker-surface-light transition cursor-pointer"
              >
                Cerrar sesión
              </button>
            </div>
          )}
        </div>
      </div>
    </header>
  );
};

export default TopNavbar;
