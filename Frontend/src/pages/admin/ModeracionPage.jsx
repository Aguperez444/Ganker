import { useEffect, useState } from "react";
import { useSearchParams } from "react-router-dom";
import TarjetaReporteModeracionComponent from "../../components/moderacion/TarjetaReporteModeracionComponent";
import ModalConfirmacionComponent from "../../components/common/ModalConfirmacionComponent";
import FiltrosBaneosComponent from "../../components/moderacion/FiltrosBaneosComponent";
import FiltrosDenunciasComponent from "../../components/moderacion/FiltrosDenunciasComponent";
import ListaBaneosComponent from "../../components/moderacion/ListaBaneosComponent";
import ListaDenunciasComponent from "../../components/moderacion/ListaDenunciasComponent";
import ListaApelacionesComponent from "../../components/moderacion/ListaApelacionesComponent";
import ModalHistorialSancionesComponent from "../../components/moderacion/ModalHistorialSancionesComponent";
import { useAuth } from "../../context/AuthContext";
import { useBuscarBaneos } from "../../hooks/useBuscarBaneos";
import {
  FILTROS_DENUNCIAS_VACIOS,
  hayFiltrosDeDenuncias,
  validarFiltrosDenuncias,
  useBuscarDenuncias,
} from "../../hooks/useBuscarDenuncias";
import { useDesbanearJugador } from "../../hooks/useDesbanearJugador";
import { obtenerIdUsuarioDesdeToken } from "../../utils/jwt";
import {
  FILTROS_BANEOS_VACIOS,
  hayFiltrosDeBaneos,
  validarFiltrosBaneos,
} from "../../utils/baneos";

// Moderación: denuncias y detalle de evidencia, seguidos del historial de baneos.
const ModeracionPage = () => {
  const { tokens } = useAuth();
  const miId = obtenerIdUsuarioDesdeToken(tokens?.access_token);

  const [successMessage, setSuccessMessage] = useState("");
  const [parametros, setParametros] = useSearchParams();
  const verApelaciones = parametros.get("vista") === "apelaciones";
  const setVerApelaciones = (mostrar) =>
    setParametros(
      (actuales) => {
        const siguientes = new URLSearchParams(actuales);
        if (mostrar) siguientes.set("vista", "apelaciones");
        else siguientes.delete("vista");
        return siguientes;
      },
      { replace: true, preventScrollReset: true }
    );
  const [versionResumen, setVersionResumen] = useState(0);
  useEffect(() => {
    if (verApelaciones)
      document
        .getElementById("sanciones")
        ?.scrollIntoView?.({ block: "start" });
  }, [verApelaciones]);
  const [baneoSeleccionado, setBaneoSeleccionado] = useState(null);
  const [filtrosBaneos, setFiltrosBaneos] = useState(FILTROS_BANEOS_VACIOS);
  const [erroresFiltros, setErroresFiltros] = useState({});
  const [filtrosDenuncias, setFiltrosDenuncias] = useState(
    FILTROS_DENUNCIAS_VACIOS
  );
  const [erroresFiltrosDenuncias, setErroresFiltrosDenuncias] = useState({});

  const baneos = useBuscarBaneos();
  const denuncias = useBuscarDenuncias();
  const desbaneo = useDesbanearJugador();

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

  // US 53 - Desbanear a mano desde el listado de baneados.
  const handleConfirmarDesbaneo = async () => {
    const mensaje = await desbaneo.confirmar();
    if (!mensaje) return;

    setSuccessMessage(mensaje);
    baneos.recargar();
    setVersionResumen((version) => version + 1);
  };

  const handleBaneado = (mensaje) => {
    setVersionResumen((version) => version + 1);
    setSuccessMessage(mensaje);
    denuncias.recargar();
    baneos.recargar();
  };

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
            Revisá los reportes de jugadores y administrá las sanciones de
            Ganker.
          </p>
        </header>

        <TarjetaReporteModeracionComponent actualizacion={versionResumen} />

        {successMessage && (
          <div className="rounded-lg border border-ganker-success/20 bg-ganker-success/10 px-4 py-3">
            <p className="text-sm text-ganker-success">✓ {successMessage}</p>
          </div>
        )}

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
            miId={miId}
            onBaneado={handleBaneado}
            onDesestimada={(mensaje) => {
              setVersionResumen((version) => version + 1);
              setSuccessMessage(mensaje);
              denuncias.recargar();
            }}
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

        <section
          id="sanciones"
          className="scroll-mt-6 rounded-2xl border border-white/10 bg-ganker-surface p-6 shadow-xl"
        >
          <h2 className="font-heading text-lg font-semibold text-ganker-text">
            Jugadores baneados
          </h2>
          <p className="mt-1 text-sm text-ganker-muted">
            Historial de baneos, del más reciente al más antiguo. Los vigentes
            se levantan solos al vencer, o podés desbanearlos a mano.
          </p>

          <div
            className="mt-5 flex gap-2"
            role="group"
            aria-label="Vista de sanciones"
          >
            <button
              type="button"
              aria-pressed={!verApelaciones}
              onClick={() => setVerApelaciones(false)}
              className={`cursor-pointer rounded-lg border px-4 py-2 text-sm font-semibold ${!verApelaciones ? "border-ganker-purple bg-ganker-purple/20 text-ganker-purple-light" : "border-white/10 text-ganker-muted"}`}
            >
              Todos los baneos
            </button>
            <button
              type="button"
              aria-pressed={verApelaciones}
              onClick={() => setVerApelaciones(true)}
              className={`cursor-pointer rounded-lg border px-4 py-2 text-sm font-semibold ${verApelaciones ? "border-ganker-purple bg-ganker-purple/20 text-ganker-purple-light" : "border-white/10 text-ganker-muted"}`}
            >
              Ver apelaciones
            </button>
          </div>
          {verApelaciones ? (
            <ListaApelacionesComponent
              miId={miId}
              onResuelta={(decision) => {
                setVersionResumen((version) => version + 1);
                setSuccessMessage(
                  decision === "accepted"
                    ? "Apelación aceptada. Se levantó el baneo del jugador."
                    : "Apelación rechazada. Se mantiene el baneo."
                );
                baneos.recargar();
              }}
            />
          ) : (
            <>
              <FiltrosBaneosComponent
                filtros={filtrosBaneos}
                errores={erroresFiltros}
                cargando={baneos.cargando}
                onChange={handleCambiarFiltro}
                onBuscar={handleBuscarBaneos}
                onLimpiar={handleLimpiarFiltros}
              />

              <ListaBaneosComponent
                onVerDetalle={(baneo) => setBaneoSeleccionado(baneo.id)}
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
            </>
          )}
        </section>
      </div>

      {/* US 53 - Confirmación explícita antes de levantar un baneo. */}
      {baneoSeleccionado && (
        <ModalHistorialSancionesComponent
          baneoId={baneoSeleccionado}
          miId={miId}
          onClose={() => setBaneoSeleccionado(null)}
          onResuelta={(decision) => {
            setVersionResumen((version) => version + 1);
            setBaneoSeleccionado(null);
            setSuccessMessage(
              decision === "accepted"
                ? "Apelación aceptada. Se levantó el baneo del jugador."
                : "Apelación rechazada. Se mantiene el baneo."
            );
            baneos.recargar();
          }}
        />
      )}
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
