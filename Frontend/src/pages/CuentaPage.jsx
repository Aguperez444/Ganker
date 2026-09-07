import { useAuth } from "../context/AuthContext";
import { useModificarJugador } from "../hooks/useModificarJugador";
import CuentaFormComponent from "../components/jugadores/CuentaFormComponent";
import AvatarUsuarioComponent from "../components/common/AvatarUsuarioComponent";

// US 02 - Modificar mis datos.
// Se llega desde el boton "Cuenta" del sidebar (ruta /app/cuenta) y se
// renderiza en la columna central del AppLayout.
function CuentaPage() {
  const { user } = useAuth();
  const {
    valores,
    errores,
    cargando,
    errorServidor,
    exito,
    handleChange,
    handleBlur,
    handleSubmit,
  } = useModificarJugador();

  return (
    <section className="min-h-full bg-ganker-bg p-6">
      <div className="mx-auto w-full max-w-3xl space-y-6">
        <header>
          <h1 className="font-heading text-2xl font-bold text-ganker-text">
            Mi cuenta
          </h1>
          <p className="mt-1 text-sm text-ganker-muted">
            Revisá y actualizá la información de tu cuenta de Ganker.
          </p>
        </header>

        {/* Datos actuales, para visualizar. Salen de `user`, asi que se
            actualizan solos al guardar los cambios. */}
        <div className="flex items-center gap-4 rounded-2xl border border-white/10 bg-ganker-surface p-6">
          <div className="flex h-14 w-14 shrink-0 items-center justify-center overflow-hidden rounded-full bg-gradient-to-br from-ganker-orange to-ganker-purple font-heading text-xl font-bold text-white">
            <AvatarUsuarioComponent user={user} />
          </div>

          <div className="min-w-0">
            <p className="truncate font-heading text-lg font-semibold text-ganker-text">
              {user.username}
            </p>
            <p className="truncate text-sm text-ganker-muted">{user.name}</p>
            <p className="truncate text-sm text-ganker-muted">{user.mail}</p>
          </div>
        </div>

        <CuentaFormComponent
          valores={valores}
          errores={errores}
          cargando={cargando}
          errorServidor={errorServidor}
          exito={exito}
          onChange={handleChange}
          onBlur={handleBlur}
          onSubmit={handleSubmit}
        />
      </div>
    </section>
  );
}

export default CuentaPage;
