import { useState } from "react";
import { Link, useLocation, useNavigate } from "react-router-dom";
import AvisoComponent from "../components/common/AvisoComponent";
import ModalConfirmacionComponent from "../components/common/ModalConfirmacionComponent";
import FichaEquipoComponent from "../components/equipos/FichaEquipoComponent";
import IntegrantesEquipoComponent from "../components/equipos/IntegrantesEquipoComponent";
import { useChat } from "../context/ChatContext";
import useMiEquipo from "../hooks/useMiEquipo";

// US 14 - Crear equipo: vista del equipo a la que se redirige al crearlo.
// US - Expulsar jugador: el lider expulsa integrantes desde la lista.
// US 43 - Transferir liderazgo: el lider elige a otro integrante.
// US 16 - Eliminar equipo: el lider lo disuelve.
// US 19 - Salirse de un equipo: un integrante comun lo abandona.
const MiEquipoPage = () => {
  const location = useLocation();
  const navigate = useNavigate();
  const {
    conversacionActivaId,
    cargarConversaciones,
    cerrarConversacionActiva,
  } = useChat();
  // Arranca con el mensaje de Crear/Unirse a equipo (si se llego desde ahi)
  // y despues lo reemplaza el de la ultima accion.
  const [mensajeExito, setMensajeExito] = useState(
    location.state?.mensajeExito ?? ""
  );
  const [integranteAExpulsar, setIntegranteAExpulsar] = useState(null);
  const [nuevoLider, setNuevoLider] = useState(null);
  const [confirmandoEliminacion, setConfirmandoEliminacion] = useState(false);
  const [confirmandoSalida, setConfirmandoSalida] = useState(false);
  const {
    equipo,
    cargando,
    error,
    expulsando,
    errorExpulsion,
    expulsarIntegrante,
    limpiarErrorExpulsion,
    transfiriendo,
    errorTransferencia,
    transferirLiderazgo,
    limpiarErrorTransferencia,
    saliendo,
    errorSalida,
    salirDelEquipo,
    limpiarErrorSalida,
    eliminando,
    errorEliminacion,
    eliminarEquipo,
    limpiarErrorEliminacion,
  } = useMiEquipo();

  const esLider = Boolean(equipo?.consultant_player_info?.is_leader);

  const handleAbrirExpulsion = (integrante) => {
    limpiarErrorExpulsion();
    setMensajeExito("");
    setIntegranteAExpulsar(integrante);
  };

  const handleCancelarExpulsion = () => {
    limpiarErrorExpulsion();
    setIntegranteAExpulsar(null);
  };

  const handleConfirmarExpulsion = async () => {
    if (!integranteAExpulsar) return;

    const exito = await expulsarIntegrante(integranteAExpulsar.user_id);

    if (!exito) return;

    setMensajeExito(
      `${integranteAExpulsar.username} fue expulsado del equipo correctamente.`
    );
    setIntegranteAExpulsar(null);
  };

  const handleAbrirTransferencia = (integrante) => {
    limpiarErrorTransferencia();
    setMensajeExito("");
    setNuevoLider(integrante);
  };

  const handleCancelarTransferencia = () => {
    limpiarErrorTransferencia();
    setNuevoLider(null);
  };

  const handleConfirmarTransferencia = async () => {
    if (!nuevoLider) return;

    const mensaje = await transferirLiderazgo(nuevoLider.user_id);

    if (!mensaje) return;

    setMensajeExito(mensaje);
    setNuevoLider(null);
  };

  // Al salir o al eliminar el equipo el jugador pierde el acceso al chatroom:
  // si lo tenia abierto se cierra (asi tambien se corta su conexion a la
  // sala) y se recarga la lista para que deje de aparecer.
  const cerrarChatDelEquipo = (conversacionDelEquipo) => {
    if (conversacionActivaId === conversacionDelEquipo) {
      cerrarConversacionActiva();
    }
    cargarConversaciones();
  };

  const handleAbrirSalida = () => {
    limpiarErrorSalida();
    setMensajeExito("");
    setConfirmandoSalida(true);
  };

  const handleCancelarSalida = () => {
    limpiarErrorSalida();
    setConfirmandoSalida(false);
  };

  const handleConfirmarSalida = async () => {
    const conversacionDelEquipo = equipo?.conversation_id;
    const mensaje = await salirDelEquipo();

    if (!mensaje) return;

    cerrarChatDelEquipo(conversacionDelEquipo);
    navigate("/app/equipos", { state: { mensajeExito: mensaje } });
  };

  const handleAbrirEliminacion = () => {
    limpiarErrorEliminacion();
    setMensajeExito("");
    setConfirmandoEliminacion(true);
  };

  const handleCancelarEliminacion = () => {
    limpiarErrorEliminacion();
    setConfirmandoEliminacion(false);
  };

  const handleConfirmarEliminacion = async () => {
    const conversacionDelEquipo = equipo?.conversation_id;
    const mensaje = await eliminarEquipo();

    if (!mensaje) return;

    cerrarChatDelEquipo(conversacionDelEquipo);
    navigate("/app/equipos", { state: { mensajeExito: mensaje } });
  };

  let contenido;

  if (cargando) {
    contenido = <p className="text-sm text-ganker-muted">Cargando...</p>;
  } else if (error) {
    contenido = <p className="text-sm text-ganker-error">{error}</p>;
  } else if (!equipo) {
    contenido = (
      <AvisoComponent
        titulo="Todavía no estás en ningún equipo"
        accion={
          <Link
            to="/app/equipos/crear"
            className="inline-block rounded-xl bg-gradient-to-r from-ganker-orange to-ganker-purple px-5 py-3 text-sm font-semibold text-white transition hover:opacity-90"
          >
            Crear equipo
          </Link>
        }
      />
    );
  } else {
    contenido = (
      <div className="space-y-6">
        <FichaEquipoComponent equipo={equipo} />

        <div className="rounded-2xl border border-white/10 bg-ganker-surface p-5 sm:p-6">
          <h2 className="mb-4 font-heading text-lg font-semibold text-ganker-text">
            Integrantes
          </h2>
          <IntegrantesEquipoComponent
            integrantes={equipo.members}
            onExpulsar={esLider ? handleAbrirExpulsion : undefined}
            onTransferirLiderazgo={
              esLider ? handleAbrirTransferencia : undefined
            }
          />
        </div>

        {/* El chat grupal (abrir la sala, enviar y ver mensajes) es de las
            US 43 y 44; esta tarjeta es su punto de entrada. */}
        {equipo.conversation_id && (
          <div className="rounded-2xl border border-white/10 bg-ganker-surface p-5 sm:p-6">
            <h2 className="font-heading text-lg font-semibold text-ganker-text">
              Chat del equipo
            </h2>
            <p className="mt-1 text-sm text-ganker-muted">
              La sala de chat se creó junto con el equipo. Los jugadores que se
              sumen entran automáticamente.
            </p>
          </div>
        )}

        <div className="rounded-2xl border border-white/10 bg-ganker-surface p-5 sm:p-6">
          <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
            <div>
              <h2 className="font-heading text-lg font-semibold text-ganker-text">
                Salir del equipo
              </h2>
              <p className="mt-1 text-sm text-ganker-muted">
                {esLider
                  ? "Como líder no podés salir directamente: primero transferí el liderazgo a otro integrante o eliminá el equipo."
                  : "Tu lugar va a quedar vacante y vas a perder el acceso al chat del equipo."}
              </p>
            </div>
            <button
              type="button"
              onClick={handleAbrirSalida}
              disabled={esLider}
              className="shrink-0 cursor-pointer rounded-xl border border-white/10 px-5 py-3 text-sm font-semibold text-ganker-text transition hover:bg-white/5 disabled:cursor-not-allowed disabled:opacity-50"
            >
              Salir del equipo
            </button>
          </div>
        </div>

        {esLider && (
          <div className="rounded-2xl border border-ganker-error/20 bg-ganker-surface p-5 sm:p-6">
            <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
              <div>
                <h2 className="font-heading text-lg font-semibold text-ganker-text">
                  Eliminar equipo
                </h2>
                <p className="mt-1 text-sm text-ganker-muted">
                  Disuelve el equipo para todos sus integrantes y cierra su
                  chat. No se puede deshacer.
                </p>
              </div>
              <button
                type="button"
                onClick={handleAbrirEliminacion}
                className="shrink-0 cursor-pointer rounded-xl border border-ganker-error/40 px-5 py-3 text-sm font-semibold text-ganker-error transition hover:bg-ganker-error/10"
              >
                Eliminar equipo
              </button>
            </div>
          </div>
        )}
      </div>
    );
  }

  return (
    <section className="min-h-full bg-ganker-bg px-4 py-6 sm:px-6 lg:px-8">
      <div className="mx-auto w-full max-w-3xl">
        <header className="mb-8">
          <h1 className="font-heading text-3xl font-bold text-ganker-text sm:text-4xl">
            Mi equipo
          </h1>
        </header>

        {mensajeExito && (
          <div
            role="status"
            className="mb-6 rounded-lg border border-ganker-success/20 bg-ganker-success/10 px-4 py-3"
          >
            <p className="text-sm text-ganker-success">✓ {mensajeExito}</p>
          </div>
        )}

        {contenido}
      </div>

      <ModalConfirmacionComponent
        isOpen={integranteAExpulsar !== null}
        title="Expulsar jugador"
        message={
          <p>
            ¿Seguro que querés expulsar a{" "}
            <span className="font-semibold text-ganker-text">
              {integranteAExpulsar?.username}
            </span>{" "}
            del equipo? Va a perder el acceso al chat del equipo y su lugar
            quedará vacante.
          </p>
        }
        confirmLabel="Expulsar"
        isLoading={expulsando}
        error={errorExpulsion}
        onConfirm={handleConfirmarExpulsion}
        onCancel={handleCancelarExpulsion}
      />

      <ModalConfirmacionComponent
        isOpen={nuevoLider !== null}
        title="Transferir liderazgo"
        message={
          <p>
            ¿Seguro que querés hacer líder a{" "}
            <span className="font-semibold text-ganker-text">
              {nuevoLider?.username}
            </span>
            ? Vas a seguir en el equipo como integrante, pero ya no vas a poder
            expulsar jugadores ni eliminar el equipo.
          </p>
        }
        confirmLabel="Transferir"
        confirmVariant="primary"
        isLoading={transfiriendo}
        error={errorTransferencia}
        onConfirm={handleConfirmarTransferencia}
        onCancel={handleCancelarTransferencia}
      />

      <ModalConfirmacionComponent
        isOpen={confirmandoSalida}
        title="Salir del equipo"
        message={
          <p>
            ¿Seguro que querés salir de{" "}
            <span className="font-semibold text-ganker-text">
              {equipo?.team_name}
            </span>
            ? Tu lugar va a quedar vacante y vas a perder el acceso al chat del
            equipo.
          </p>
        }
        confirmLabel="Salir del equipo"
        isLoading={saliendo}
        error={errorSalida}
        onConfirm={handleConfirmarSalida}
        onCancel={handleCancelarSalida}
      />

      <ModalConfirmacionComponent
        isOpen={confirmandoEliminacion}
        title="Eliminar equipo"
        message={
          <>
            <p>
              ¿Seguro que querés eliminar{" "}
              <span className="font-semibold text-ganker-text">
                {equipo?.team_name}
              </span>
              ?
            </p>
            <p className="mt-2">
              Todos los integrantes van a quedar sin equipo (libres para unirse
              o crear otro) y el chat del equipo se va a cerrar. Esta acción no
              se puede deshacer.
            </p>
          </>
        }
        confirmLabel="Eliminar equipo"
        isLoading={eliminando}
        error={errorEliminacion}
        onConfirm={handleConfirmarEliminacion}
        onCancel={handleCancelarEliminacion}
      />
    </section>
  );
};

export default MiEquipoPage;
