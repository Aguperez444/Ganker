import GameForm from "../../components/juegos/GameForm";

const RegisterGamePage = () => {
  return (
    <main className="flex min-h-screen items-center justify-center px-4">
      <section className="w-full max-w-lg rounded-xl p-8 shadow-lg">
        <header className="mb-6">
          <h1 className="text-3xl font-bold">Registrar videojuego</h1>

          <p className="mt-2 text-gray-500">
            Agrega un nuevo videojuego a Ganker.
          </p>
        </header>

        <GameForm />
      </section>
    </main>
  );
};

export default RegisterGamePage;
