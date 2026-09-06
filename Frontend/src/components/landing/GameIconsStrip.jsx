function GameIconsStrip({ className = "" }) {
  return (
    <div className={`flex items-center justify-center ${className}`}>
      <img
        src="/images/juegos_strip.webp"
        alt="Juegos soportados: League of Legends, Valorant, Counter-Strike 2, Overwatch"
        className="h-9 sm:h-11 w-auto max-w-full object-contain opacity-90 hover:opacity-100 transition-opacity"
      />
    </div>
  );
}

export default GameIconsStrip;
