import { Link, useLocation } from "react-router-dom";

const PESTANAS = [
  { ruta: "/login", etiqueta: "Iniciar Sesión" },
  { ruta: "/registro", etiqueta: "Registrate" },
];

// No sabe nada de LoginPage ni de si esa ruta existe todavia: solo compara
// la URL actual contra cada pestaña. El dia que exista /login, esta pestaña
// se resalta sola, sin tocar este archivo.
function AuthTabs() {
  const { pathname } = useLocation();

  return (
    <div className="mb-6 flex rounded-lg border border-tertiary bg-secondary p-1">
      {PESTANAS.map(({ ruta, etiqueta }) => {
        const activa = pathname === ruta;
        return (
          <Link
            key={ruta}
            to={ruta}
            className={`flex-1 rounded-md py-2.5 text-center text-sm font-semibold font-body transition ${
              activa ? "bg-tertiary text-text-primary" : "text-text-secondary hover:text-text-primary"
            }`}
          >
            {etiqueta}
          </Link>
        );
      })}
    </div>
  );
}

export default AuthTabs;
