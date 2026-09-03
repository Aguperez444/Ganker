const STEPS = [
  {
    step: 1,
    title: "Cargá tu perfil real",
    description:
      "Un perfil por juego, rango por rol, personajes main ordenados por preferencia y tus horarios.",
    icon: (
      <svg
        className="h-6 w-6 text-slate-400"
        fill="none"
        viewBox="0 0 24 24"
        stroke="currentColor"
        strokeWidth={1.5}
        aria-hidden="true"
      >
        <path
          strokeLinecap="round"
          strokeLinejoin="round"
          d="M15.75 6a3.75 3.75 0 11-7.5 0 3.75 3.75 0 017.5 0zM4.501 20.118a7.5 7.5 0 0114.998 0A17.933 17.933 0 0112 21.75c-2.676 0-5.216-.584-7.499-1.632z"
        />
      </svg>
    ),
  },
  {
    step: 2,
    title: "Encontrá tu nivel",
    description:
      "Filtrás por juego, rol y rango. Ganker ordena por afinidad, no por popularidad.",
    icon: (
      <svg
        className="h-6 w-6 text-slate-400"
        fill="none"
        viewBox="0 0 24 24"
        stroke="currentColor"
        strokeWidth={1.5}
        aria-hidden="true"
      >
        <path
          strokeLinecap="round"
          strokeLinejoin="round"
          d="M10.5 6h9.75M10.5 6a1.5 1.5 0 11-3 0m3 0a1.5 1.5 0 10-3 0M3.75 6H7.5m3 12h9.75m-9.75 0a1.5 1.5 0 01-3 0m3 0a1.5 1.5 0 00-3 0m-3.75 0H7.5m9-6h3.75m-3.75 0a1.5 1.5 0 01-3 0m3 0a1.5 1.5 0 00-3 0m-9.75 0h9.75"
        />
      </svg>
    ),
  },
  {
    step: 3,
    title: "Armá el equipo",
    description:
      "Chateás, invitás y gestionás el roster desde un solo lugar. Sin servidores paralelos.",
    icon: (
      <svg
        className="h-6 w-6 text-slate-400"
        fill="none"
        viewBox="0 0 24 24"
        stroke="currentColor"
        strokeWidth={1.5}
        aria-hidden="true"
      >
        <path
          strokeLinecap="round"
          strokeLinejoin="round"
          d="M18 18.72a9.094 9.094 0 003.741-.479 3 3 0 00-4.682-2.72m.94 3.198l.001.031c0 .225-.012.447-.037.666A11.944 11.944 0 0112 21c-2.17 0-4.207-.576-5.963-1.584A6.062 6.062 0 016 18.719m12 0a5.971 5.971 0 00-.941-3.197m0 0A5.995 5.995 0 0012 12.75a5.995 5.995 0 00-5.058 2.772m0 0a3 3 0 00-4.681 2.72 8.986 8.986 0 003.74.477m.999-3.198A5.971 5.971 0 006 18.719m12-9.75a3 3 0 11-6 0 3 3 0 016 0zm-3 0a3 3 0 11-6 0 3 3 0 016 0z"
        />
      </svg>
    ),
  },
];

function HowItWorksSection() {
  return (
    <section className="relative w-full py-16 overflow-hidden">
      {/* Marcas de agua decorativas laterales */}
      <div
        className="pointer-events-none absolute -left-12 top-1/2 -translate-y-1/2 select-none opacity-5 hidden lg:block"
        aria-hidden="true"
      >
        <img
          src="/images/favicon.svg"
          alt=""
          className="h-72 w-72 filter brightness-150"
        />
      </div>

      <div
        className="pointer-events-none absolute -right-12 top-1/2 -translate-y-1/2 select-none opacity-5 hidden lg:block"
        aria-hidden="true"
      >
        <svg
          className="h-72 w-72 text-purple-400"
          viewBox="740 809 130 140"
          fill="currentColor"
        >
          <path d="m 742.35566,811.79709 h 50.82551 v 131.31867 h 40.24658 l 21.50323,-9.31422 h 5.28939 l -12.76372,34.95698 -0.80501,1.72485 H 740.40081 l -0.11477,-3.10472 15.1786,-18.16843 1.83984,-2.29979 V 827.66574 Z" />
        </svg>
      </div>

      <div className="relative z-10 mx-auto max-w-xl px-4">
        <h3 className="mb-8 text-center text-2xl sm:text-3xl font-bold text-white font-heading">
          Cómo funciona
        </h3>

        <div className="space-y-4">
          {STEPS.map(({ step, title, description, icon }) => (
            <div
              key={step}
              className="group rounded-2xl border border-[#2b214d]/80 bg-[#120d26]/80 p-5 md:p-6 backdrop-blur-sm transition-all duration-300 hover:border-purple-600/50 hover:bg-[#16102f]/90 shadow-lg"
            >
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-3">
                  <span className="flex h-7 w-7 items-center justify-center rounded-lg bg-gradient-to-br from-[#f27238] to-[#d9531e] text-sm font-bold text-white shadow-md">
                    {step}
                  </span>
                  <h4 className="text-base sm:text-lg font-bold text-white">
                    {title}
                  </h4>
                </div>
                <div className="text-slate-400 transition-colors group-hover:text-purple-300">
                  {icon}
                </div>
              </div>
              <p className="mt-2.5 text-xs sm:text-sm text-slate-300/85 leading-relaxed pl-10">
                {description}
              </p>
            </div>
          ))}
        </div>
      </div>
    </section>
  );
}

export default HowItWorksSection;
