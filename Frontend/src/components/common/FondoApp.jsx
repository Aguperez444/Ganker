function FondoApp() {
  const apiUrl = import.meta.env.VITE_API_URL;

  return (
    <main className=" text-slate-100" stroke="currentColor">
      <div className="flex h-lvh w-full flex-row items-center justify-center bg-[url('../../../images/Fondo_con_Iconos_de_Juegos.png')] bg-[length:100%_100%] bg-center bg-no-repeat">
          <h1 className="text-5xl font-body text-ganker-purple-light ">Encuentra.</h1>
          <h1 className="text-5xl font-body text-ganker-text">Conecta.</h1>
          <h1 className="text-5xl font-body text-ganker-orange"> Compite.</h1>
      </div>
    </main>
  );
}

export default FondoApp;