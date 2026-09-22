import { useState, useRef, useEffect } from "react";
import { Link, useNavigate } from "react-router-dom";
import { useAuth } from "../../context/AuthContext";
import { useChat } from "../../context/ChatContext";
import AvatarUsuarioComponent from "../common/AvatarUsuarioComponent";
import { esAdmin } from "../../utils/rutas";

const TopNavbar = ({
  onOpenMenu,
  onOpenChat,
  showChatButton = true,
  chatVisible = false,
}) => {
  const { user, logout } = useAuth();
  const { totalNoLeidos } = useChat();
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
        {/* Atajo para enviar un mensaje: siempre al lado del avatar, no solo
            en mobile/tablet. Funciona como interruptor: en desktop
            oculta/muestra el panel fijo de chat, en mobile/admin abre/cierra
            el drawer. `chatVisible` refleja ese estado en el label y en el
            estilo (igual criterio que el item activo del sidebar). */}
        {showChatButton && (
          <button
            type="button"
            onClick={onOpenChat}
            aria-pressed={chatVisible}
            aria-label={
              chatVisible
                ? "Ocultar chat"
                : totalNoLeidos > 0
                  ? `Enviar mensaje (${totalNoLeidos} mensajes sin leer)`
                  : "Enviar mensaje"
            }
            title={chatVisible ? "Ocultar chat" : "Enviar mensaje"}
            className={`relative flex h-10 w-10 cursor-pointer items-center justify-center rounded-lg transition hover:bg-ganker-surface-light hover:text-ganker-text ${
              chatVisible
                ? "bg-ganker-purple/20 text-ganker-text"
                : "text-ganker-muted"
            }`}
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
            {totalNoLeidos > 0 && (
              <span
                className="absolute -top-1 -right-1 flex h-4 min-w-4 items-center justify-center rounded-full bg-ganker-error px-1 text-[10px] font-bold leading-none text-white ring-2 ring-ganker-surface"
                aria-hidden="true"
              >
                {totalNoLeidos > 99 ? "99+" : totalNoLeidos}
              </span>
            )}
          </button>
        )}

        {/* Usuario */}
        <div className="relative" ref={userMenuRef}>
          <button
            type="button"
            onClick={() => setIsUserMenuOpen((prev) => !prev)}
            aria-label={
              user ? `Abrir cuenta de ${user.username}` : "Abrir cuenta"
            }
            title={user?.username}
            className="flex h-10 w-10 cursor-pointer items-center justify-center overflow-hidden rounded-full border border-ganker-purple/40 bg-ganker-surface-light text-sm font-semibold text-ganker-text transition hover:border-ganker-purple-light"
          >
            <AvatarUsuarioComponent user={user} />
          </button>

          {isUserMenuOpen && (
            <div className="absolute right-0 z-50 mt-2 w-48 rounded-xl border border-white/10 bg-ganker-surface p-2 shadow-2xl">
              {user && (
                <div className="border-b border-white/10 px-3 py-2">
                  <p className="truncate text-xs font-semibold text-ganker-text">
                    {user.username}
                  </p>
                  <p className="truncate text-xs text-ganker-muted">
                    {user.mail}
                  </p>
                </div>
              )}
              {/* Unico paso entre las dos areas: el sidebar de jugador ya no
                  ofrece admin, y el de admin ya no ofrece volver. */}
              {esAdmin(user) && (
                <>
                  <Link
                    to="/app/admin"
                    onClick={() => setIsUserMenuOpen(false)}
                    className="block rounded-lg px-3 py-2 text-xs font-semibold text-ganker-purple-light transition hover:bg-ganker-surface-light"
                  >
                    Panel de administración
                  </Link>
                  <Link
                    to="/app"
                    onClick={() => setIsUserMenuOpen(false)}
                    className="block rounded-lg px-3 py-2 text-xs font-semibold text-ganker-purple-light transition hover:bg-ganker-surface-light"
                  >
                    Panel jugador
                  </Link>
                </>
              )}

              {/* US 02 - Modificar mis datos */}
              <Link
                to="/app/cuenta"
                onClick={() => setIsUserMenuOpen(false)}
                className="block rounded-lg px-3 py-2 text-xs font-semibold text-ganker-muted transition hover:bg-ganker-surface-light hover:text-ganker-text"
              >
                Mi cuenta
              </Link>
              <Link
                to="/"
                onClick={() => setIsUserMenuOpen(false)}
                className="block rounded-lg px-3 py-2 text-xs font-semibold text-ganker-muted transition hover:bg-ganker-surface-light hover:text-ganker-text"
              >
                Página principal
              </Link>
              <button
                type="button"
                onClick={handleLogout}
                className="w-full cursor-pointer rounded-lg px-3 py-2 text-left text-xs font-semibold text-ganker-error transition hover:bg-ganker-surface-light"
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
