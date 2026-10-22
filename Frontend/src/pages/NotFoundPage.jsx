import { Link } from "react-router-dom";
import Header from "../components/common/Header.jsx";
import Footer from "../components/common/Footer.jsx";

function NotFoundPage() {
  return (
    <div className="flex min-h-screen flex-col bg-[#0a0718] text-white selection:bg-orange-500 selection:text-white">
      <Header />
      <main className="relative flex flex-1 items-center justify-center overflow-hidden px-4 py-16 sm:py-24">
        <div
          className="pointer-events-none absolute inset-0 bg-[radial-gradient(ellipse_at_50%_35%,rgba(109,40,217,0.2),transparent_65%)]"
          aria-hidden="true"
        />
        <section
          className="relative w-full max-w-2xl text-center"
          aria-labelledby="not-found-title"
        >
          <span className="inline-flex rounded-full border border-purple-500/30 bg-purple-500/10 px-4 py-2 font-heading text-xs font-bold uppercase tracking-[0.2em] text-purple-300">
            Fuera del mapa
          </span>
          <div
            className="my-6 select-none bg-gradient-to-br from-[#f27238] via-[#df5522] to-[#987bf0] bg-clip-text font-heading text-[8rem] font-extrabold leading-none tracking-tighter text-transparent sm:text-[12rem]"
            aria-hidden="true"
          >
            404
          </div>
          <h1
            id="not-found-title"
            className="font-heading text-3xl font-bold tracking-tight sm:text-4xl"
          >
            Esta partida no existe
          </h1>
          <p className="mx-auto mt-4 max-w-md text-base leading-relaxed text-slate-400">
            La página que buscás no está disponible o la dirección es
            incorrecta. Volvé al inicio y encontrá tu próximo equipo.
          </p>
          <Link
            to="/"
            className="mt-8 inline-flex min-h-12 items-center justify-center gap-2 rounded-xl bg-gradient-to-r from-[#f27238] via-[#df5522] to-[#8b5cf6] px-7 py-3 font-heading text-sm font-bold uppercase tracking-wider text-white shadow-lg shadow-orange-500/20 transition-transform hover:scale-105 focus-visible:outline-2 focus-visible:outline-offset-4 focus-visible:outline-orange-400"
          >
            <svg
              className="h-5 w-5"
              viewBox="0 0 24 24"
              fill="none"
              stroke="currentColor"
              strokeWidth="2"
              aria-hidden="true"
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                d="m12 19-7-7 7-7m-7 7h14"
              />
            </svg>
            Volver al inicio
          </Link>
        </section>
      </main>
      <Footer />
    </div>
  );
}

export default NotFoundPage;
