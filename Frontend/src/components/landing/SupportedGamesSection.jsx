const GAMES = [
  {
    name: "League of Legends",
    image: "/images/games/lol.webp",
    alt: "Jugadores y equipos competitivos de League of Legends en Ganker",
    objectPosition: "center 12%",
  },
  {
    name: "Valorant",
    image: "/images/games/valorant.webp",
    alt: "Jugadores y equipos competitivos de Valorant en Ganker",
    objectPosition: "center 5%",
  },
  {
    name: "Counter-Strike 2",
    image: "/images/games/cs2.webp",
    alt: "Jugadores y equipos competitivos de Counter-Strike 2 en Ganker",
    objectPosition: "center 20%",
  },
  {
    name: "Overwatch 2",
    image: "/images/games/ow.webp",
    alt: "Jugadores y equipos competitivos de Overwatch 2 en Ganker",
    objectPosition: "center 75%",
  },
];

function SupportedGamesSection() {
  return (
    <section className="relative w-full py-12 overflow-hidden">
      <div className="relative z-10 mx-auto max-w-xl px-4">
        <h2 className="mb-6 text-left sm:text-left text-2xl sm:text-3xl font-bold text-white font-heading">
          Juegos destacados
        </h2>

        <div className="space-y-4">
          {GAMES.map((game) => (
            <div
              key={game.name}
              className="group relative h-32 sm:h-36 w-full overflow-hidden rounded-2xl border border-[#2b214d]/80 bg-[#120d26] shadow-lg transition-all duration-300 hover:border-purple-500/60"
            >
              {/* Imagen de fondo del juego con posicion vertical ajustada */}
              <img
                src={game.image}
                alt={game.alt}
                className="h-full w-full object-cover transition-transform duration-500 ease-out group-hover:scale-105"
                style={{ objectPosition: game.objectPosition }}
                loading="lazy"
              />

              {/* Degradado para garantizar contraste del texto */}
              <div
                className="absolute inset-0 bg-gradient-to-t from-black/80 via-black/25 to-transparent"
                aria-hidden="true"
              />

              {/* Nombre del juego en la esquina inferior izquierda */}
              <div className="absolute bottom-0 left-0 p-4">
                <h3 className="text-base sm:text-lg font-bold text-white tracking-wide drop-shadow-md">
                  {game.name}
                </h3>
              </div>
            </div>
          ))}
        </div>
      </div>
    </section>
  );
}

export default SupportedGamesSection;
