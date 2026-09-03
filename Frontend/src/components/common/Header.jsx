import { Link, NavLink } from "react-router-dom";

function Header() {
	return (
		<header className="border-b-2 border-ganker-purple bg-ganker-bg px-8 py-6 font-heading text-ganker-text">
			<div className="flex w-full items-center justify-between gap-8">
				<Link to="/" className="flex items-center gap-3">
					<img
						src="/images/Logo_y_letras_blanco.svg"
						alt="Ganker"
						className="h-16 w-auto"
					/>
				</Link>

				<nav className="flex items-center justify-between gap-5 text-base font-bold uppercase tracking-wide">
					<NavLink
						to="/registro"
						className={({ isActive }) =>
							`rounded border-2 border-transparent bg-transparent px-2 py-2 text-2xl font-heading transition-all duration-300 hover:border-ganker-purple hover:px-10 hover:text-ganker-orange ${
								isActive ? "text-ganker-orange" : "text-ganker-text"
							}`
						}
					>
						Registrarse
					</NavLink>
					<NavLink
						to="/login"
						className={({ isActive }) =>
							`rounded border-2 border-transparent bg-transparent px-2 py-2 text-2xl font-heading transition-all duration-300 hover:border-ganker-purple hover:px-10 hover:text-ganker-orange ${
								isActive ? "text-ganker-orange" : "text-ganker-text"
							}`
						}
					>
						Iniciar sesión
					</NavLink>
				</nav>
			</div>
		</header>
	);
}

export default Header;
