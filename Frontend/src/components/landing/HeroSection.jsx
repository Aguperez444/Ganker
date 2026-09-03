import { useState, useEffect } from "react";
import GameIconsStrip from "./GameIconsStrip";

const WORDS = [
  { text: "Encuentra.", color: "text-[#f27238]", glowColor: "#f27238" },
  { text: "Conecta.", color: "text-white", glowColor: "#ffffff" },
  { text: "Compite.", color: "text-[#987bf0]", glowColor: "#987bf0" },
];

function HeroSection() {
  const fullText = WORDS.map((w) => w.text).join(" ");
  const [charCount, setCharCount] = useState(0);
  const [isDone, setIsDone] = useState(false);

  useEffect(() => {
    if (charCount < fullText.length) {
      const timer = setTimeout(() => {
        setCharCount((prev) => prev + 1);
      }, 55);
      return () => clearTimeout(timer);
    } else {
      setIsDone(true);
    }
  }, [charCount, fullText.length]);

  // Calcula qué porción de cada palabra está visible
  let remaining = charCount;
  const renderedWords = WORDS.map((word) => {
    if (remaining <= 0) {
      return { ...word, visibleText: "" };
    }
    const charsToTake = Math.min(remaining, word.text.length);
    const visibleText = word.text.slice(0, charsToTake);
    remaining -= word.text.length + 1; // descuenta la palabra y el espacio
    return { ...word, visibleText };
  });

  return (
    <section className="relative w-full pt-16 pb-20 md:pt-24 md:pb-28 overflow-hidden bg-[#0a0718]">
      {/* Resplandor ambiental sutil */}
      <div
        className="pointer-events-none absolute inset-0 bg-[radial-gradient(ellipse_75%_55%_at_50%_0%,rgba(109,40,217,0.2),transparent_70%)]"
        aria-hidden="true"
      />
      <div
        className="pointer-events-none absolute inset-0 bg-gradient-to-b from-[#11092a]/50 via-transparent to-[#0a0718]"
        aria-hidden="true"
      />

      {/* Contenido central del Hero */}
      <div className="relative z-10 mx-auto max-w-5xl px-4 text-center">
        {/* Titular con efecto máquina de escribir y resplandor neón gaming */}
        <h2
          className="text-4xl sm:text-5xl md:text-6xl lg:text-7xl font-extrabold tracking-tight font-heading inline-flex flex-wrap justify-center items-center gap-x-2 sm:gap-x-3.5"
          aria-label="Encuentra. Conecta. Compite."
        >
          {renderedWords.map((word, idx) => (
            <span
              key={idx}
              className={`${word.color} transition-all duration-300 ${
                isDone
                  ? "animate-gaming-pulse inline-block hover:scale-105 cursor-default drop-shadow-[0_0_12px_currentColor]"
                  : ""
              }`}
            >
              {word.visibleText}
            </span>
          ))}

          {/* Cursor gaming animado estilo terminal */}
          <span
            className={`inline-block text-[#f27238] font-mono font-light select-none ${
              isDone ? "animate-pulse" : "opacity-90"
            }`}
            style={{ textShadow: "0 0 10px #f27238" }}
            aria-hidden="true"
          >
            _
          </span>
        </h2>

        <p className="mt-4 text-xs sm:text-sm md:text-base font-semibold uppercase tracking-[0.25em] text-[#f27238] drop-shadow-[0_0_8px_rgba(242,114,56,0.3)]">
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
