const GAMES = [
  {
    name: "League of Legends",
    image: "/images/games/lol.webp",
    alt: "League of Legends art",
  },
  {
    name: "Valorant",
    image: "/images/games/valorant.webp",
    alt: "Valorant art",
  },
  {
    name: "Counter-Strike 2",
    image: "/images/games/cs2.webp",
    alt: "Counter-Strike 2 art",
  },
  {
    name: "Overwatch 2",
    image: "/images/games/ow.webp",
    alt: "Overwatch 2 art",
  },
];

function SupportedGamesSection() {
  return (
    <section className="relative w-full py-12 overflow-hidden">
      {/* Marcas de agua decorativas laterales */}
      <div
        className="pointer-events-none absolute -left-12 top-1/2 -translate-y-1/2 select-none opacity-5 hidden lg:block"
        aria-hidden="true"
      >
        <svg
          className="h-72 w-72 text-red-500"
          viewBox="1070 820 150 150"
          fill="currentColor"
        >
          <path d="m 1077.3692,820.39007 v 65.77432 l 54.2755,71.5238 h 50.3655 l 0.229,-4.5996 -101.6511,-132.69852 z" />
          <path d="m 1163.6083,909.21572 h 51.3881 l 18.7014,-23.9052 v -65.21083 -2.11407 l -52.8517,64.88557 -17.5631,24.39308 -1.2198,1.93113 z" />
        </svg>
      </div>

      <div
        className="pointer-events-none absolute -right-12 top-1/2 -translate-y-1/2 select-none opacity-5 hidden lg:block"
        aria-hidden="true"
      >
        <svg
          className="h-72 w-72 text-purple-400"
          viewBox="1810 805 140 150"
          fill="currentColor"
        >
          <path d="m 1868.6665,808.35172 c -21.6501,2.60804 -38.642,10.77207 -51.1137,22.1672 l 17.5786,17.57827 c 9.7772,-8.16131 22.7424,-13.38946 38.5763,-13.12653 11.6772,0.1772 23.4993,4.60064 33.261,12.09491 l 17.8782,-17.8781 C 1910.7765,816.3884 1891.7667,808.21 1868.6665,808.35172 Z" />
        </svg>
      </div>

      <div className="relative z-10 mx-auto max-w-xl px-4">
        <h3 className="mb-6 text-left sm:text-left text-2xl sm:text-3xl font-bold text-white font-heading">
          Juegos soportados
        </h3>

        <div className="space-y-4">
          {GAMES.map((game) => (
            <div
              key={game.name}
              className="group relative h-28 sm:h-32 w-full overflow-hidden rounded-2xl border border-[#2b214d]/80 bg-[#120d26] shadow-lg transition-all duration-300 hover:border-purple-500/60"
            >
              {/* Imagen de fondo del juego */}
              <img
                src={game.image}
                alt={game.alt}
                className="h-full w-full object-cover object-center transition-transform duration-500 ease-out group-hover:scale-105"
                loading="lazy"
              />

              {/* Degradado para garantizar contraste del texto */}
              <div
                className="absolute inset-0 bg-gradient-to-t from-black/80 via-black/25 to-transparent"
                aria-hidden="true"
              />

              {/* Nombre del juego en la esquina inferior izquierda */}
              <div className="absolute bottom-0 left-0 p-4">
                <span className="text-base sm:text-lg font-bold text-white tracking-wide drop-shadow-md">
                  {game.name}
                </span>
              </div>
            </div>
          ))}
        </div>
      </div>
    </section>
  );
}

export default SupportedGamesSection;
