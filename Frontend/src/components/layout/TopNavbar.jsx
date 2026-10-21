import { useState, useRef, useEffect } from "react";
import { Link, useLocation, useNavigate } from "react-router-dom";
import { useAuth } from "../../context/AuthContext";
import ChatNavbarButton from "../chat/ChatNavbarButton.jsx";
import AvatarUsuarioComponent from "../common/AvatarUsuarioComponent";
import { esAdmin } from "../../utils/rutas";

const TopNavbar = ({
  onOpenMenu,
  onOpenChat,
  showChatButton = true,
  chatVisible = false,
}) => {
  const { user, logout } = useAuth();
  const navigate = useNavigate();
  const { pathname } = useLocation();
  const enPanelAdmin = pathname.startsWith("/app/admin");
  const inicioDelPanel = enPanelAdmin ? "/app/admin" : "/app";
  // En el inicio de cada panel no hay "atras" dentro de la app.
  const mostrarAtras = pathname.replace(/\/$/, "") !== inicioDelPanel;

  // React Router guarda en history.state.idx cuantas pantallas de la app hay
  // antes de esta. Si es 0 (se entro por un link directo o se recargo en la
  // primera), navigate(-1) sacaria al jugador del sitio: en ese caso se va
  // al inicio del panel.
  const handleAtras = () => {
    if (window.history.state?.idx > 0) {
      navigate(-1);
    } else {
      navigate(inicioDelPanel);
    }
  };
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

        {/* Atras: misma accion que la flecha del navegador */}
        {mostrarAtras && (
          <button
            type="button"
            onClick={handleAtras}
            aria-label="Atrás"
            title="Atrás"
            className="flex h-10 shrink-0 cursor-pointer items-center gap-1 rounded-lg px-2 text-sm font-semibold text-ganker-muted transition hover:bg-ganker-surface-light hover:text-ganker-text"
          >
            <svg
              viewBox="0 0 24 24"
              fill="none"
              stroke="currentColor"
              strokeWidth="1.8"
              className="h-5 w-5"
              aria-hidden="true"
            >
              <path d="m15 18-6-6 6-6" />
            </svg>
            <span className="hidden sm:inline">Atrás</span>
          </button>
        )}
      </div>

      <div className="ml-3 flex shrink-0 items-center gap-2">
        {/* Atajo para enviar un mensaje: siempre al lado del avatar, no solo
            en mobile/tablet. Funciona como interruptor: en desktop
            oculta/muestra el panel fijo de chat, en mobile/admin abre/cierra
            el drawer. `chatVisible` refleja ese estado en el label y en el
            estilo (igual criterio que el item activo del sidebar). */}
        {/* Paso directo entre las dos areas (solo admin/owner): lleva a la
            que no se esta viendo. Antes vivia en el menu del avatar. */}
        {esAdmin(user) && (
          <Link
            to={enPanelAdmin ? "/app" : "/app/admin"}
            title={
              enPanelAdmin
                ? "Ir al panel de jugador"
                : "Ir al panel de administración"
            }
            className="flex h-10 shrink-0 items-center gap-2 rounded-lg border border-ganker-purple/40 px-3 text-xs font-semibold text-ganker-purple-light transition hover:bg-ganker-surface-light hover:text-ganker-text"
          >
            <svg
              viewBox="0 0 24 24"
              fill="none"
              stroke="currentColor"
              strokeWidth="1.8"
              className="h-4 w-4 shrink-0"
              aria-hidden="true"
            >
              <path d="M7 7h11l-3-3" />
              <path d="M17 17H6l3 3" />
            </svg>
            {/* En mobile queda solo el icono; el texto sigue para lectores. */}
            <span className="sr-only sm:not-sr-only">
              {enPanelAdmin ? "Panel jugador" : "Panel admin"}
            </span>
          </Link>
        )}

        {showChatButton && (
          <ChatNavbarButton onOpenChat={onOpenChat} chatVisible={chatVisible} />
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
              {/* US 02 - Modificar mis datos */}
              <Link
                to="/app/cuenta"
                onClick={() => setIsUserMenuOpen(false)}
                className="block rounded-lg px-3 py-2 text-xs font-semibold text-ganker-muted transition hover:bg-ganker-surface-light hover:text-ganker-text"
              >
                Mi cuenta
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
