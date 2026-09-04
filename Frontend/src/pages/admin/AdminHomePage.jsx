const AdminHomePage = () => {
  return (
    <section className="min-h-full bg-ganker-bg p-6">
      <header>
        <p className="text-xs font-semibold tracking-[0.15em] text-ganker-purple-light uppercase">
          Administración
        </p>

        <h1 className="mt-2 font-heading text-3xl font-bold text-ganker-text">
          Panel administrativo
        </h1>

        <p className="mt-2 max-w-2xl text-sm text-ganker-muted">
          Desde esta sección se incorporarán las funcionalidades de
          administración de Ganker.
        </p>
      </header>
    </section>
  );
};

export default AdminHomePage;
