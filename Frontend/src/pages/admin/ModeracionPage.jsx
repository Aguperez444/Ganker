import { useState } from "react";
import AvatarUsuarioComponent from "../../components/common/AvatarUsuarioComponent";
import ModalConfirmacionComponent from "../../components/common/ModalConfirmacionComponent";
import ModalBanearJugadorComponent from "../../components/moderacion/ModalBanearJugadorComponent";
import { useAuth } from "../../context/AuthContext";
import { useBuscarUsuario } from "../../hooks/useBuscarUsuario";
import { useDesbanearJugador } from "../../hooks/useDesbanearJugador";
import { useJugadoresBaneados } from "../../hooks/useJugadoresBaneados";
import { obtenerIdUsuarioDesdeToken } from "../../utils/jwt";
import { formatearVencimiento } from "../../utils/baneos";

// US 36 - Banear jugador (admin): se busca al jugador por ID (el mismo
// endpoint del perfil público, ver useBuscarUsuario), se ve quién es y recién
// ahí se puede aplicar la sanción.
//
// La protección por rol vive en la ruta (ProtectedRoute con ROLES_ADMIN) y en
// el backend (require_admin). Acá además se oculta la acción sobre la propia
// cuenta del administrador.
const ModeracionPage = () => {
  const { tokens } = useAuth();
  const miId = obtenerIdUsuarioDesdeToken(tokens?.access_token);

  const [successMessage, setSuccessMessage] = useState("");
  const [jugadorABanear, setJugadorABanear] = useState(null);

  const {
    idBuscado,
    encontrado,
    buscando,
    error: errorBusqueda,
    setIdBuscado,
    buscar,
  } = useBuscarUsuario();
  const baneos = useJugadoresBaneados();
  const desbaneo = useDesbanearJugador();

  const handleBuscar = (e) => {
    e.preventDefault();
    setSuccessMessage("");
    buscar().then((ok) => {
      if (ok) baneos.cargar();
    });
  };

  const handleAbrirBaneo = (jugador) => {
    setSuccessMessage("");
    setJugadorABanear(jugador);
  };

  const handleCerrarBaneo = () => {
    setJugadorABanear(null);
    // El baneo cambia el estado de la cuenta: se refresca el listado para
    // que la fila del jugador quede como "Ya baneado".
    baneos.cargar({ forzar: true });
  };

  // US 36 - Desbanear a mano desde el listado de baneos vigentes.
  const handleConfirmarDesbaneo = async () => {
    const mensaje = await desbaneo.confirmar();
    if (!mensaje) return;

    setSuccessMessage(mensaje);
    baneos.cargar({ forzar: true });
  };

  const esUnoMismo = (usuario) =>
    miId !== null && usuario?.user_id === miId;
  const yaBaneado = Boolean(
    encontrado && baneos.estaBaneado(encontrado.user_id)
  );

  return (
    <section className="min-h-full bg-ganker-bg p-6">
      <div className="mx-auto w-full max-w-3xl space-y-8">
        <header>
          <p className="text-xs font-semibold tracking-[0.15em] text-ganker-purple-light uppercase">
            Administración
          </p>
          <h1 className="mt-2 font-heading text-3xl font-bold text-ganker-text">
            Moderación
          </h1>
          <p className="mt-2 max-w-2xl text-sm text-ganker-muted">
            Aplicá sanciones a las cuentas que incumplan las normas de Ganker.
          </p>
        </header>

        {successMessage && (
          <div className="rounded-lg border border-ganker-success/20 bg-ganker-success/10 px-4 py-3">
            <p className="text-sm text-ganker-success">✓ {successMessage}</p>
          </div>
        )}

        <section className="rounded-2xl border border-white/10 bg-ganker-surface p-6 shadow-xl">
          <h2 className="font-heading text-lg font-semibold text-ganker-text">
            Banear jugador
          </h2>
          <p className="mt-1 text-sm text-ganker-muted">
            Buscá al jugador por su ID (el número que aparece en la URL de su
            perfil, /app/jugadores/&lt;id&gt;) y aplicá la sanción con su motivo
            y duración.
          </p>

          <form
            onSubmit={handleBuscar}
            className="mt-5 flex flex-col gap-3 sm:flex-row sm:items-end"
          >
            <div className="flex-1">
              <label
                htmlFor="moderacion-id"
                className="mb-1 block text-xs font-semibold text-ganker-text"
              >
                ID del jugador
              </label>
              <input
                id="moderacion-id"
                type="number"
                min="1"
                inputMode="numeric"
                value={idBuscado}
                onChange={(e) => setIdBuscado(e.target.value)}
                placeholder="Ej. 12"
                className="w-full rounded-lg border border-white/10 bg-ganker-surface-light px-3 py-2.5 text-sm text-ganker-text focus:border-ganker-purple focus:ring-2 focus:ring-ganker-purple focus:outline-none"
              />
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
                  @{encontrado.username} · ID {encontrado.user_id}
                </p>
              </div>

              {esUnoMismo(encontrado) ? (
                <p className="text-xs text-ganker-muted sm:max-w-48">
                  Es tu cuenta: no podés banear a tu propio usuario.
                </p>
              ) : (
                <button
                  type="button"
                  onClick={() => handleAbrirBaneo(encontrado)}
                  disabled={yaBaneado}
                  className="shrink-0 cursor-pointer rounded-lg border border-ganker-error/40 px-3 py-1.5 text-sm font-semibold text-ganker-error transition hover:bg-ganker-error/10 disabled:cursor-not-allowed disabled:opacity-50"
                >
                  {yaBaneado ? "Ya baneado" : "Banear jugador"}
                </button>
              )}
            </div>
          )}
        </section>

        <section className="rounded-2xl border border-white/10 bg-ganker-surface p-6 shadow-xl">
          <div className="flex flex-wrap items-center justify-between gap-3">
            <div>
              <h2 className="font-heading text-lg font-semibold text-ganker-text">
                Baneos vigentes
              </h2>
              <p className="mt-1 text-sm text-ganker-muted">
                Se desbanean solos al vencer. También podés desbanear a mano.
              </p>
            </div>
            <button
              type="button"
              onClick={() => baneos.cargar({ forzar: true })}
              disabled={baneos.cargando}
              className="cursor-pointer rounded-lg border border-white/10 px-3 py-1.5 text-sm font-semibold text-ganker-text transition hover:bg-white/5 disabled:cursor-not-allowed disabled:opacity-50"
            >
              {baneos.cargando ? "Cargando..." : "Ver baneos"}
            </button>
          </div>

      {baneos.error && (
        <div className="mt-4 rounded-lg border border-ganker-error/20 bg-ganker-error/10 px-4 py-3">
          <p className="text-sm text-ganker-error">{baneos.error}</p>
        </div>
      )}

      {baneos.baneados.length === 0 ? (
        <p className="mt-5 text-sm text-ganker-muted">
          Todavía no hay baneos registrados.
        </p>
      ) : (
        <ul className="mt-5 divide-y divide-white/10 overflow-hidden rounded-xl border border-white/10">
          {baneos.baneados.map((baneo) => (
            <li
              key={baneo.id}
              className="flex flex-col gap-1 bg-ganker-surface-light px-4 py-3 sm:flex-row sm:items-center sm:justify-between"
            >
              <div className="min-w-0">
                <p className="truncate font-medium text-ganker-text">
                  @{baneo.banned_user_username} · ID {baneo.banned_user_id}
                </p>
                <p className="mt-0.5 truncate text-xs text-ganker-muted">
                  {baneo.reason}
                </p>
              </div>
              <div className="flex shrink-0 flex-wrap items-center gap-3">
                <p className="text-xs text-ganker-muted">
                  Vence {formatearVencimiento(baneo.date_expire)}
                </p>
                {/* US 36 - Levanta el baneo antes de su vencimiento. No se
                    ofrece sobre la propia cuenta: el backend lo rechaza. */}
                {baneo.banned_user_id !== miId && (
                  <button
                    type="button"
                    onClick={() => desbaneo.abrir(baneo)}
                    className="cursor-pointer rounded-lg border border-ganker-purple/60 px-3 py-1.5 text-sm font-semibold text-ganker-purple-light transition hover:bg-ganker-purple/20"
                  >
                    Desbanear
                  </button>
                )}
              </div>
            </li>
          ))}
        </ul>
      )}
    </section>
      </div>

      {jugadorABanear && (
        <ModalBanearJugadorComponent
          jugador={jugadorABanear}
          onClose={handleCerrarBaneo}
        />
      )}

      {/* US 36 - Confirmación explícita antes de levantar un baneo. */}
      <ModalConfirmacionComponent
        isOpen={Boolean(desbaneo.baneo)}
        title="Desbanear jugador"
        message={
          <>
            Se va a levantar el baneo de{" "}
            <strong className="text-ganker-text">
              @{desbaneo.baneo?.banned_user_username}
            </strong>{" "}
            (ID {desbaneo.baneo?.banned_user_id}). La cuenta va a poder volver
            a iniciar sesión de inmediato.
          </>
        }
        confirmLabel="Confirmar desbaneo"
        confirmVariant="primary"
        isLoading={desbaneo.cargando}
        error={desbaneo.error}
        onConfirm={handleConfirmarDesbaneo}
        onCancel={desbaneo.cancelar}
      />
    </section>
  );
};

export default ModeracionPage;
