import { Link, NavLink, useNavigate } from "react-router-dom";
<<<<<<< HEAD
import { useAuth } from "../../context/AuthContext";
=======
import { useAuth } from "../../context/AuthContext.jsx";
>>>>>>> origin/main

function Header() {
  const { isAuthenticated, logout } = useAuth();
  const navigate = useNavigate();

  const handleLogout = () => {
    logout();
    navigate("/");
  };

  return (
    <header className="sticky top-0 z-50 w-full border-b border-[#1f173b]/70 bg-[#0a0718]/90 backdrop-blur-md px-4 sm:px-8 py-3.5 font-heading text-white">
      <div className="mx-auto flex max-w-7xl items-center justify-between">
        <Link to="/" className="flex items-center gap-3 group">
          <h1 className="sr-only">Ganker</h1>
          <img
            src="/images/Logo_y_letras_blanco.svg"
            alt="Ganker"
            className="h-8 sm:h-9 w-auto transition-transform duration-300 group-hover:scale-105"
          />
        </Link>

        <nav className="flex items-center gap-4 sm:gap-6 text-xs sm:text-sm font-bold uppercase tracking-wider">
          {isAuthenticated ? (
            <>
              <NavLink
                to="/app"
<<<<<<< HEAD
                className="rounded-lg px-3 py-1.5 text-slate-300 transition-colors duration-200 hover:bg-white/5 hover:text-white"
=======
                className={({ isActive }) =>
                  `rounded-lg px-3 py-1.5 transition-colors duration-200 ${
                    isActive
                      ? "text-[#f27238]"
                      : "text-slate-300 hover:text-white hover:bg-white/5"
                  }`
                }
>>>>>>> origin/main
              >
                Ir a la app
              </NavLink>
              <button
                type="button"
                onClick={handleLogout}
<<<<<<< HEAD
                className="cursor-pointer rounded-lg px-3 py-1.5 text-[#f27238] transition-colors duration-200 hover:bg-white/5 hover:text-orange-400"
=======
                className="rounded-lg px-3 py-1.5 text-ganker-error transition-colors duration-200 hover:bg-white/5"
>>>>>>> origin/main
              >
                CERRAR SESIÓN
              </button>
            </>
          ) : (
            <>
              <NavLink
                to="/registro"
                className={({ isActive }) =>
                  `rounded-lg px-3 py-1.5 transition-colors duration-200 ${
                    isActive
                      ? "text-[#f27238]"
                      : "text-slate-300 hover:text-white hover:bg-white/5"
                  }`
                }
              >
                Registrarse
              </NavLink>
              <NavLink
                to="/login"
                className={({ isActive }) =>
                  `rounded-lg px-3 py-1.5 transition-colors duration-200 ${
                    isActive
                      ? "text-[#f27238]"
                      : "text-slate-300 hover:text-white hover:bg-white/5"
                  }`
                }
              >
                Iniciar sesión
              </NavLink>
            </>
          )}
        </nav>
      </div>
    </header>
  );
}

export default Header;