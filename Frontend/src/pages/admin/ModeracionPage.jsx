import { useState } from "react";
import AvatarUsuarioComponent from "../../components/common/AvatarUsuarioComponent";
import ModalConfirmacionComponent from "../../components/common/ModalConfirmacionComponent";
import FiltrosBaneosComponent from "../../components/moderacion/FiltrosBaneosComponent";
import FiltrosDenunciasComponent from "../../components/moderacion/FiltrosDenunciasComponent";
import ListaBaneosComponent from "../../components/moderacion/ListaBaneosComponent";
import ListaDenunciasComponent from "../../components/moderacion/ListaDenunciasComponent";
import ModalBanearJugadorComponent from "../../components/moderacion/ModalBanearJugadorComponent";
import { useAuth } from "../../context/AuthContext";
import { useBuscarBaneos } from "../../hooks/useBuscarBaneos";
import {
  FILTROS_DENUNCIAS_VACIOS,
  hayFiltrosDeDenuncias,
  validarFiltrosDenuncias,
  useBuscarDenuncias,
} from "../../hooks/useBuscarDenuncias";
import { useBuscarUsuario } from "../../hooks/useBuscarUsuario";
import { useDesbanearJugador } from "../../hooks/useDesbanearJugador";
import { obtenerIdUsuarioDesdeToken } from "../../utils/jwt";
import {
  FILTROS_BANEOS_VACIOS,
  hayFiltrosDeBaneos,
  validarFiltrosBaneos,
} from "../../utils/baneos";

// US 36 - Banear jugador (admin): se busca al jugador por su nombre de usuario
// (ver useBuscarUsuario), se ve quién es y recién ahí se puede aplicar la
// sanción.
//
// La protección por rol vive en la ruta (ProtectedRoute con ROLES_ADMIN) y en
// el backend (require_admin). Acá además se oculta la acción sobre la propia
// cuenta del administrador.
//
// US 53 - Levantar suspensión: "Desbanear" desde el listado de baneados.
//
// Buscar jugadores baneados: el listado es el historial de baneos del
// backend, con filtros combinables y paginado (ver useBuscarBaneos). Los
// filtros del formulario recién se aplican al tocar "Buscar".
//
// US 51 - Buscar denuncias a un jugador: filtros combinables, paginación y
// orden por fecha de creación desde el backend.
const ModeracionPage = () => {
  const { tokens } = useAuth();
  const miId = obtenerIdUsuarioDesdeToken(tokens?.access_token);

  const [successMessage, setSuccessMessage] = useState("");
  const [jugadorABanear, setJugadorABanear] = useState(null);
  const [mensajeBaneo, setMensajeBaneo] = useState("");
  const [filtrosBaneos, setFiltrosBaneos] = useState(FILTROS_BANEOS_VACIOS);
  const [erroresFiltros, setErroresFiltros] = useState({});
  const [filtrosDenuncias, setFiltrosDenuncias] = useState(
    FILTROS_DENUNCIAS_VACIOS
  );
  const [erroresFiltrosDenuncias, setErroresFiltrosDenuncias] = useState({});

  const {
    usernameBuscado,
    encontrado,
    buscando,
    error: errorBusqueda,
    setUsernameBuscado,
    buscar,
    limpiar,
  } = useBuscarUsuario();
  const baneos = useBuscarBaneos();
  const denuncias = useBuscarDenuncias();
  const desbaneo = useDesbanearJugador();

  const handleBuscar = (e) => {
    e.preventDefault();
    setSuccessMessage("");
    buscar();
  };

  const handleCambiarFiltro = (campo, valor) => {
    setFiltrosBaneos((actuales) => ({ ...actuales, [campo]: valor }));
    setErroresFiltros({});
  };

  const handleBuscarBaneos = () => {
    const errores = validarFiltrosBaneos(filtrosBaneos);
    setErroresFiltros(errores);
    if (Object.keys(errores).length > 0) return;

    setSuccessMessage("");
    baneos.buscar(filtrosBaneos);
  };

  const handleLimpiarFiltros = () => {
    setFiltrosBaneos(FILTROS_BANEOS_VACIOS);
    setErroresFiltros({});
    baneos.buscar(FILTROS_BANEOS_VACIOS);
  };

  const handleCambiarFiltroDenuncia = (campo, valor) => {
    setFiltrosDenuncias((actuales) => ({
      ...actuales,
      [campo]: valor,
    }));

    setErroresFiltrosDenuncias({});
  };

  const handleBuscarDenuncias = () => {
    const errores = validarFiltrosDenuncias(filtrosDenuncias);

    setErroresFiltrosDenuncias(errores);

    if (Object.keys(errores).length > 0) return;

    setSuccessMessage("");
    denuncias.buscar(filtrosDenuncias);
  };

  const handleLimpiarFiltrosDenuncias = () => {
    setFiltrosDenuncias(FILTROS_DENUNCIAS_VACIOS);
    setErroresFiltrosDenuncias({});
    denuncias.buscar(FILTROS_DENUNCIAS_VACIOS);
  };

  const handleAbrirBaneo = (jugador) => {
    setSuccessMessage("");
    setMensajeBaneo("");
    setJugadorABanear(jugador);
  };

  // Si el baneo se aplicó, el jugador deja de aparecer en las búsquedas: se
  // limpia la tarjeta y se refresca el listado de baneados desde la primera
  // página, que es donde aparece el baneo nuevo.
  const handleCerrarBaneo = () => {
    setJugadorABanear(null);
    if (!mensajeBaneo) return;

    setSuccessMessage(mensajeBaneo);
    limpiar();
    baneos.buscar(baneos.filtrosAplicados);
  };

  // US 53 - Desbanear a mano desde el listado de baneados.
  const handleConfirmarDesbaneo = async () => {
    const mensaje = await desbaneo.confirmar();
    if (!mensaje) return;

    setSuccessMessage(mensaje);
    baneos.recargar();
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
          <h2 className="font-heading text-lg font-semibold text-ganker-text">
            Jugadores baneados
          </h2>
          <p className="mt-1 text-sm text-ganker-muted">
            Historial de baneos, del más reciente al más antiguo. Los vigentes
            se levantan solos al vencer, o podés desbanearlos a mano.
          </p>

          <FiltrosBaneosComponent
            filtros={filtrosBaneos}
            errores={erroresFiltros}
            cargando={baneos.cargando}
            onChange={handleCambiarFiltro}
            onBuscar={handleBuscarBaneos}
            onLimpiar={handleLimpiarFiltros}
          />

          <ListaBaneosComponent
            baneos={baneos.baneos}
            cargando={baneos.cargando}
            error={baneos.error}
            hayFiltros={hayFiltrosDeBaneos(baneos.filtrosAplicados)}
            pagina={baneos.pagina}
            hayMas={baneos.hayMas}
            miId={miId}
            onDesbanear={desbaneo.abrir}
            onPaginaAnterior={baneos.paginaAnterior}
            onPaginaSiguiente={baneos.paginaSiguiente}
          />
        </section>

        <section className="rounded-2xl border border-white/10 bg-ganker-surface p-6 shadow-xl">
          <h2 className="font-heading text-lg font-semibold text-ganker-text">
            Denuncias a jugadores
          </h2>
          <p className="mt-1 text-sm text-ganker-muted">
            Buscá denuncias por jugador reportado, denunciante, administrador
            que resolvió, estado, motivo o fecha. Los resultados se ordenan por
            fecha de creación y se ignoran usuarios eliminados.
          </p>

          <FiltrosDenunciasComponent
            filtros={filtrosDenuncias}
            cargando={denuncias.cargando}
            onChange={handleCambiarFiltroDenuncia}
            onBuscar={handleBuscarDenuncias}
            onLimpiar={handleLimpiarFiltrosDenuncias}
            errores={erroresFiltrosDenuncias}
          />

          <ListaDenunciasComponent
            denuncias={denuncias.denuncias}
            cargando={denuncias.cargando}
            error={denuncias.error}
            hayFiltros={hayFiltrosDeDenuncias(denuncias.filtrosAplicados)}
            pagina={denuncias.pagina}
            hayMas={denuncias.hayMas}
            onPaginaAnterior={denuncias.paginaAnterior}
            onPaginaSiguiente={denuncias.paginaSiguiente}
          />
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
