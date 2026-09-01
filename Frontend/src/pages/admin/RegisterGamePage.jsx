import GameForm from "../../components/games/GameFormComponent";

const RegisterGamePage = () => {
  return (
    <main className=" relative flex min-h-screen items-center justify-center overflow-hidden bg-ganker-bg px-6">
      {/* Glow violeta decorativo */}
      <div className=" absolute -top-40 -left-40 h-96 w-96 rounded-full bg-ganker-purple/20 blur-3xl" />

      {/* Glow naranja decorativo */}
      <div className=" absolute -right-40 -bottom-40 h-96 w-96 rounded-full bg-ganker-orange/10 blur-3xl" />

      <section className=" relative z-10 w-full max-w-lg rounded-2xl border border-white/10 bg-ganker-surface/90 p-8 shadow-2xl backdrop-blur">
        <header className="mb-8 text-center">
          <h1 className=" text-3xl font-bold text-ganker-text font-heading">
            Registrar videojuego
          </h1>

          <p className=" mt-3 text-sm text-ganker-muted">
            Agregá un nuevo videojuego a la plataforma.
          </p>
        </header>

        <GameForm />
      </section>
    </main>
  );
};

export default RegisterGamePage;
