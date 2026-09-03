import GameIconsStrip from "./GameIconsStrip";

function HeroSection() {
  return (
    <section className="relative w-full pt-16 pb-20 md:pt-24 md:pb-28 overflow-hidden">
      {/* Fondo con marcas de agua de los juegos y lineas diagonales */}
      <div
        className="absolute inset-0 bg-[url('/images/Fondo_con_Iconos_de_Juegos.webp')] bg-top bg-no-repeat bg-cover opacity-80"
        aria-hidden="true"
      />

      {/* Degradado superior e inferior para integracion visual */}
      <div
        className="absolute inset-0 bg-gradient-to-b from-[#0a0718]/80 via-transparent to-[#0a0718]"
        aria-hidden="true"
      />

      {/* Contenido central del Hero */}
      <div className="relative z-10 mx-auto max-w-5xl px-4 text-center">
        <h2 className="text-4xl sm:text-5xl md:text-6xl lg:text-7xl font-extrabold tracking-tight font-heading">
          <span className="text-[#f27238]">Encuentra</span>
          <span className="text-white">.</span>
          <span className="text-white">Conecta</span>
          <span className="text-white">.</span>
          <span className="text-[#987bf0]">Compite</span>
          <span className="text-[#987bf0]">.</span>
        </h2>

        <p className="mt-4 text-xs sm:text-sm md:text-base font-semibold uppercase tracking-[0.25em] text-[#f27238]">
          Matchmaking por nivel real
        </p>

        <div className="mt-8 flex justify-center">
          <GameIconsStrip className="max-w-xs sm:max-w-sm md:max-w-md" />
        </div>
      </div>
    </section>
  );
}

export default HeroSection;
