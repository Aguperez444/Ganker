import { useState } from "react";
import AvatarUsuarioComponent from "../../components/common/AvatarUsuarioComponent";
import ModalDarDeBajaUsuarioComponent from "../../components/jugadores/ModalDarDeBajaUsuarioComponent";
import { CLASES_BOTON_ELIMINAR } from "../../components/common/botonesAccion";
import { useBuscarUsuario } from "../../hooks/useBuscarUsuario";
import { useDarDeBajaUsuario } from "../../hooks/useDarDeBajaUsuario";

// US 50 - Eliminar cuenta de usuario (admin): se busca al usuario por ID
// (ver useBuscarUsuario), se ve quien es y recien ahi se lo puede dar de baja.
const UsuariosPage = () => {
  const [successMessage, setSuccessMessage] = useState("");

  const {
    idBuscado,
    encontrado,
    buscando,
    error: errorBusqueda,
    setIdBuscado,
    buscar,
    limpiar,
  } = useBuscarUsuario();
  const baja = useDarDeBajaUsuario();

  const handleBuscar = (e) => {
    e.preventDefault();
    setSuccessMessage("");
    buscar();
  };

  const handleConfirmarBaja = async () => {
    const mensaje = await baja.confirmar();
    if (!mensaje) return;

    setSuccessMessage(mensaje);
    limpiar();
  };

  const cantidadPerfiles = encontrado?.profiles?.length ?? 0;

  return (
    <section className="min-h-full bg-ganker-bg p-6">
      <div className="mx-auto w-full max-w-3xl">
        <header>
          <p className="text-xs font-semibold tracking-[0.15em] text-ganker-purple-light uppercase">
            Administración
          </p>
          <h1 className="mt-2 font-heading text-3xl font-bold text-ganker-text">
            Usuarios
          </h1>
          <p className="mt-2 max-w-2xl text-sm text-ganker-muted">
            Dá de baja cuentas de jugadores u otros administradores que
            incumplan las normas.
          </p>
        </header>

        {successMessage && (
          <div className="mt-6 rounded-lg border border-ganker-success/20 bg-ganker-success/10 px-4 py-3">
            <p className="text-sm text-ganker-success">✓ {successMessage}</p>
          </div>
        )}

        <section className="mt-8 rounded-2xl border border-white/10 bg-ganker-surface p-6 shadow-xl">
          <form
            onSubmit={handleBuscar}
            className="flex flex-col gap-3 sm:flex-row sm:items-end"
          >
            <div className="flex-1">
              <label
                htmlFor="usuarios-id"
                className="mb-1 block text-xs font-semibold text-ganker-text"
              >
                ID del usuario
              </label>
              <input
                id="usuarios-id"
                type="number"
                min="1"
                inputMode="numeric"
                value={idBuscado}
                onChange={(e) => setIdBuscado(e.target.value)}
                placeholder="Ej. 12"
                className="w-full rounded-lg border border-white/10 bg-ganker-surface-light px-3 py-2.5 text-sm text-ganker-text focus:border-ganker-purple focus:ring-2 focus:ring-ganker-purple focus:outline-none"
              />
              <p className="mt-1 text-xs text-ganker-muted">
                Es el número que aparece en la URL de su perfil
                (/app/jugadores/&lt;id&gt;).
              </p>
            </div>
            <button
              type="submit"
              disabled={buscando}
              className="cursor-pointer self-start rounded-lg bg-gradient-to-r from-ganker-orange via-ganker-orange-light to-ganker-purple px-4 py-2.5 text-sm font-semibold text-white shadow-lg transition hover:opacity-90 disabled:cursor-not-allowed disabled:opacity-50 sm:self-auto"
            >
              {buscando ? "Buscando..." : "Buscar"}
            </button>
          </form>

          {errorBusqueda && (
            <div className="mt-4 rounded-lg border border-ganker-error/20 bg-ganker-error/10 px-4 py-3">
              <p className="text-sm text-ganker-error">{errorBusqueda}</p>
            </div>
          )}

          {encontrado && (
            <div className="mt-6 flex flex-col gap-4 rounded-xl border border-white/10 bg-ganker-surface-light p-5 sm:flex-row sm:items-center">
              <div className="flex h-14 w-14 shrink-0 items-center justify-center overflow-hidden rounded-full bg-gradient-to-br from-ganker-orange to-ganker-purple font-heading text-xl font-bold text-white">
                <AvatarUsuarioComponent user={encontrado} />
              </div>
              <div className="min-w-0 flex-1">
                <p className="truncate font-heading text-lg font-semibold text-ganker-text">
                  {encontrado.name}
                </p>
                <p className="truncate text-sm text-ganker-muted">
                  @{encontrado.username} · ID {encontrado.user_id} ·{" "}
                  {cantidadPerfiles} perfil
                  {cantidadPerfiles === 1 ? "" : "es"} de juego
                </p>
              </div>
              {baja.esUnoMismo(encontrado) ? (
                <p className="text-xs text-ganker-muted sm:max-w-48">
                  Es tu cuenta: para darla de baja usá Mi cuenta.
                </p>
              ) : (
                <button
                  type="button"
                  onClick={() => baja.abrir(encontrado)}
                  className={`shrink-0 ${CLASES_BOTON_ELIMINAR}`}
                >
                  Dar de baja
                </button>
              )}
            </div>
          )}
        </section>
      </div>

      <ModalDarDeBajaUsuarioComponent
        usuario={baja.usuario}
        cargando={baja.cargando}
        error={baja.error}
        bloqueado={baja.esUnoMismo(baja.usuario)}
        onConfirm={handleConfirmarBaja}
        onCancel={baja.cancelar}
      />
    </section>
  );
};

export default UsuariosPage;
