import { portadaDeJuego } from "../../utils/juegos";

// Portada del juego como fondo (imagenes de la landing) con un degradado
// encima para que el texto se lea. Si el juego no tiene portada propia usa
// un degradado violeta del tema.
function FondoJuegoComponent({ nombreJuego, className = "", children }) {
  const portada = portadaDeJuego(nombreJuego);

  return (
    <div className={`relative overflow-hidden ${className}`}>
      {portada ? (
        <img
          src={portada.imagen}
          alt=""
          aria-hidden="true"
          loading="lazy"
          className="absolute inset-0 h-full w-full object-cover transition-transform duration-500 ease-out group-hover:scale-105"
          style={{ objectPosition: portada.posicion }}
        />
      ) : (
        <div
          aria-hidden="true"
          className="absolute inset-0 bg-gradient-to-br from-ganker-purple/60 via-ganker-surface-light to-ganker-orange/30"
        />
      )}
      <div
        aria-hidden="true"
        className="absolute inset-0 bg-gradient-to-t from-ganker-bg via-ganker-bg/70 to-ganker-bg/10"
      />
      <div className="relative h-full">{children}</div>
    </div>
  );
}

export default FondoJuegoComponent;
