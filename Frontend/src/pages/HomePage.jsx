/**
 * Pantalla inicial. Sirve como verificacion rapida de que el entorno
 * quedo bien configurado (React + Tailwind + variables de entorno).
 * Se puede reemplazar por completo cuando arranquen las features reales.
 */
function HomePage() {
  const apiUrl = import.meta.env.VITE_API_URL;

  return (
    <main className="flex min-h-screen flex-col items-center justify-center gap-4 bg-slate-900 p-8 text-slate-100">
      <h1 className="text-4xl font-bold">Ganker</h1>
      <p className="text-slate-400">
        Entorno de frontend levantado correctamente.
      </p>
      <p className="rounded bg-slate-800 px-3 py-2 font-mono text-sm">
        VITE_API_URL: {apiUrl ?? "(sin definir - revisa tu archivo .env)"}
      </p>
    </main>
  );
}

export default HomePage;
