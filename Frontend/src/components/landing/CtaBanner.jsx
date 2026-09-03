import { Link } from "react-router-dom";

function CtaBanner() {
  return (
    <section className="w-full px-4 pt-4 pb-20">
      <div className="mx-auto max-w-xl sm:max-w-2xl rounded-2xl border border-purple-900/50 bg-gradient-to-r from-[#170e2c] via-[#20123d] to-[#2c1042] p-6 sm:p-8 shadow-2xl">
        <div className="flex flex-col sm:flex-row items-center justify-between gap-6 text-center sm:text-left">
          <div>
            <h3 className="text-lg sm:text-xl md:text-2xl font-bold text-white font-heading">
              Tu próximo equipo ya está buscando.
            </h3>
            <p className="mt-1 text-xs sm:text-sm text-slate-400">
              Gratis para siempre. Sin bots, sin smurfs sin verificar.
            </p>
          </div>

          <Link
            to="/registro"
            className="inline-flex items-center justify-center rounded-xl bg-gradient-to-r from-[#f27238] via-[#df5522] to-[#8b5cf6] px-6 py-3 text-xs sm:text-sm font-bold uppercase tracking-wider text-white shadow-lg shadow-orange-500/20 transition-all duration-300 hover:scale-105 hover:shadow-orange-500/30 active:scale-95 whitespace-nowrap"
          >
            Empezar ahora
          </Link>
        </div>
      </div>
    </section>
  );
}

export default CtaBanner;
