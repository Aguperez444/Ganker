import { useState } from "react";
import AvatarUsuarioComponent from "../../components/common/AvatarUsuarioComponent";
import ModalConfirmacionComponent from "../../components/common/ModalConfirmacionComponent";
import ModalBanearJugadorComponent from "../../components/moderacion/ModalBanearJugadorComponent";
import { useAuth } from "../../context/AuthContext";
import { useBuscarUsuario } from "../../hooks/useBuscarUsuario";
import { useDesbanearJugador } from "../../hooks/useDesbanearJugador";
import { useJugadoresBaneados } from "../../hooks/useJugadoresBaneados";
import { obtenerIdUsuarioDesdeToken } from "../../utils/jwt";
import {
  esVencimientoPermanente,
  formatearVencimiento,
} from "../../utils/baneos";

// US 36 - Banear jugador (admin): se busca al jugador por su nombre de usuario
// (ver useBuscarUsuario), se ve quién es y recién ahí se puede aplicar la
// sanción.
//
// La protección por rol vive en la ruta (ProtectedRoute con ROLES_ADMIN) y en
// el backend (require_admin). Acá además se oculta la acción sobre la propia
// cuenta del administrador.
//
// US 53 - Levantar suspensión: el listado de baneados viene resuelto del
// backend (solo baneos vigentes); acá se muestra, se filtra por username en
// el backend y se ofrece "Desbanear".
const ModeracionPage = () => {
  const { tokens } = useAuth();
  const miId = obtenerIdUsuarioDesdeToken(tokens?.access_token);

  const [successMessage, setSuccessMessage] = useState("");
  const [jugadorABanear, setJugadorABanear] = useState(null);
  const [mensajeBaneo, setMensajeBaneo] = useState("");
  const [filtroBaneados, setFiltroBaneados] = useState("");

  const {
    usernameBuscado,
    encontrado,
    buscando,
    error: errorBusqueda,
    setUsernameBuscado,
    buscar,
    limpiar,
  } = useBuscarUsuario();
  const baneos = useJugadoresBaneados();
  const desbaneo = useDesbanearJugador();

  const handleBuscar = (e) => {
    e.preventDefault();
    setSuccessMessage("");
    buscar();
  };

  const recargarBaneados = () =>
    baneos.recargar({ username: filtroBaneados.trim().replace(/^@/, "") });

  const handleFiltrarBaneados = (e) => {
    e.preventDefault();
    recargarBaneados();
  };

  const handleAbrirBaneo = (jugador) => {
    setSuccessMessage("");
    setMensajeBaneo("");
    setJugadorABanear(jugador);
  };

  // Si el baneo se aplicó, el jugador deja de aparecer en las búsquedas: se
  // limpia la tarjeta y se refresca el listado de baneados.
  const handleCerrarBaneo = () => {
    setJugadorABanear(null);
    if (!mensajeBaneo) return;

    setSuccessMessage(mensajeBaneo);
    limpiar();
    recargarBaneados();
  };

  // US 53 - Desbanear a mano desde el listado de baneados.
  const handleConfirmarDesbaneo = async () => {
    const mensaje = await desbaneo.confirmar();
    if (!mensaje) return;

    setSuccessMessage(mensaje);
    recargarBaneados();
  };

  const esUnoMismo = (usuario) => miId !== null && usuario?.user_id === miId;

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
            Buscá al jugador por su nombre de usuario y aplicá la sanción con su
            motivo y duración.
          </p>

          <form
            onSubmit={handleBuscar}
            className="mt-5 flex flex-col gap-3 sm:flex-row sm:items-end"
          >
            <div className="flex-1">
              <label
                htmlFor="moderacion-username"
                className="mb-1 block text-xs font-semibold text-ganker-text"
              >
                Nombre de usuario
              </label>
              <input
                id="moderacion-username"
                type="text"
                autoComplete="off"
                spellCheck={false}
                value={usernameBuscado}
                onChange={(e) => setUsernameBuscado(e.target.value)}
                placeholder="Ej. pedro"
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
                  className="shrink-0 cursor-pointer rounded-lg border border-ganker-error/40 px-3 py-1.5 text-sm font-semibold text-ganker-error transition hover:bg-ganker-error/10 disabled:cursor-not-allowed disabled:opacity-50"
                >
                  Banear jugador
                </button>
              )}
            </div>
          )}
        </section>

        <section className="rounded-2xl border border-white/10 bg-ganker-surface p-6 shadow-xl">
          <div className="flex flex-wrap items-center justify-between gap-3">
            <div>
              <h2 className="font-heading text-lg font-semibold text-ganker-text">
                Jugadores baneados
              </h2>
              <p className="mt-1 text-sm text-ganker-muted">
                Se desbanean solos al vencer. También podés desbanear a mano.
              </p>
            </div>
          </div>

          <form
            onSubmit={handleFiltrarBaneados}
            className="mt-5 flex flex-col gap-3 sm:flex-row sm:items-end"
          >
            <div className="flex-1">
              <label
                htmlFor="moderacion-filtro-baneados"
                className="mb-1 block text-xs font-semibold text-ganker-text"
              >
                Filtrar por nombre de usuario
              </label>
              <input
                id="moderacion-filtro-baneados"
                type="text"
                autoComplete="off"
                spellCheck={false}
                value={filtroBaneados}
                onChange={(e) => setFiltroBaneados(e.target.value)}
                placeholder="Vacío para ver todos"
                className="w-full rounded-lg border border-white/10 bg-ganker-surface-light px-3 py-2.5 text-sm text-ganker-text focus:border-ganker-purple focus:ring-2 focus:ring-ganker-purple focus:outline-none"
              />
            </div>
            <button
              type="submit"
              disabled={baneos.cargando}
              className="cursor-pointer self-start rounded-lg border border-white/10 px-4 py-2.5 text-sm font-semibold text-ganker-text transition hover:bg-white/5 disabled:cursor-not-allowed disabled:opacity-50 sm:self-auto"
            >
              {baneos.cargando ? "Cargando..." : "Filtrar"}
            </button>
          </form>

          {baneos.error && (
            <div className="mt-4 rounded-lg border border-ganker-error/20 bg-ganker-error/10 px-4 py-3">
              <p className="text-sm text-ganker-error">{baneos.error}</p>
            </div>
          )}

          {baneos.baneados.length === 0 ? (
            <p className="mt-5 text-sm text-ganker-muted">
              {baneos.cargando
                ? "Cargando baneos..."
                : "No hay jugadores baneados."}
            </p>
          ) : (
            <ul className="mt-5 divide-y divide-white/10 overflow-hidden rounded-xl border border-white/10">
              {baneos.baneados.map((baneo) => (
                <li
                  key={baneo.user_id}
                  className="flex flex-col gap-1 bg-ganker-surface-light px-4 py-3 sm:flex-row sm:items-center sm:justify-between"
                >
                  <div className="min-w-0">
                    <p className="truncate font-medium text-ganker-text">
                      @{baneo.username} · ID {baneo.user_id}
                    </p>
                    <p className="mt-0.5 truncate text-xs text-ganker-muted">
                      {baneo.reason}
                    </p>
                  </div>
                  <div className="flex shrink-0 flex-wrap items-center gap-3">
                    <p className="text-xs text-ganker-muted">
                      {!baneo.expires_at ||
                      esVencimientoPermanente(baneo.expires_at)
                        ? "Permanente"
                        : `Vence ${formatearVencimiento(baneo.expires_at)}`}
                    </p>
                    {/* US 53 - Levanta el baneo antes de su vencimiento. No se
                    ofrece sobre la propia cuenta: el backend lo rechaza. */}
                    {baneo.user_id !== miId && (
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
          onBaneado={setMensajeBaneo}
        />
      )}

      {/* US 53 - Confirmación explícita antes de levantar un baneo. */}
      <ModalConfirmacionComponent
        isOpen={Boolean(desbaneo.baneo)}
        title="Desbanear jugador"
        message={
          <>
            Se va a levantar el baneo de{" "}
            <strong className="text-ganker-text">
              @{desbaneo.baneo?.username}
            </strong>{" "}
            (ID {desbaneo.baneo?.user_id}). La cuenta va a poder volver a
            iniciar sesión de inmediato.
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
