import { useAuth } from "../../context/AuthContext.jsx";

  const TopNavbar = ({ onOpenMenu, onOpenChat, showChatButton = true }) => {
    const { logout } = useAuth();

    const handleLogout = () => {
      logout();
      window.location.assign("/");
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

          {/* Cerrar sesion */}
          <button
            type="button"
            onClick={handleLogout}
            className="hidden rounded-lg px-3 py-2 text-sm font-semibold text-ganker-muted transition hover:bg-ganker-surface-light hover:text-ganker-text sm:block"
          >
            Cerrar sesión
          </button>

          {/* Usuario */}
          <button
            type="button"
            aria-label="Abrir cuenta"
            className="flex h-10 w-10 shrink-0 cursor-pointer items-center justify-center rounded-full border border-ganker-purple/40 bg-ganker-surface-light text-sm font-semibold text-ganker-text transition hover:border-ganker-purple-light"
          >
            G
          </button>
        </div>
      </header>
    );
  };

  export default TopNavbar;