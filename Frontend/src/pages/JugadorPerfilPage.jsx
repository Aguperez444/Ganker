import { useState } from "react";
import { Link, useParams, useSearchParams } from "react-router-dom";
import AvatarUsuarioComponent from "../components/common/AvatarUsuarioComponent";
import AvisoComponent from "../components/common/AvisoComponent";
import DiscordJugadorComponent from "../components/discord/DiscordJugadorComponent";
import IconoChicoComponent from "../components/common/IconoChicoComponent";
<<<<<<< HEAD
import BotonReportarJugadorComponent from "../components/moderacion/BotonReportarJugadorComponent";
=======
import ModalDarDeBajaUsuarioComponent from "../components/jugadores/ModalDarDeBajaUsuarioComponent";
>>>>>>> 38f8f29191b7d31cc688a8cde445054ba63df7c1
import PerfilDeJuegoDetalleComponent from "../components/jugadores/PerfilDeJuegoDetalleComponent";
import { CLASES_BOTON_ELIMINAR } from "../components/common/botonesAccion";
import { useAuth } from "../context/AuthContext";
import { useChat } from "../context/ChatContext";
import { useDarDeBajaUsuario } from "../hooks/useDarDeBajaUsuario";
import usePerfilJugador from "../hooks/usePerfilJugador";
import { esAdmin } from "../utils/rutas";
import { formatearConexionReciente } from "../utils/tiempo";

// Perfil de otro jugador con todos sus perfiles de juego (LoL, Valorant,
// Overwatch...). Se entra desde Buscar jugadores, el chat o un equipo (ver
// utils/rutas.js -> rutaPerfilJugador). `?juego=<videogame_id>` deja
// preseleccionado ese juego (ej. el que se estaba filtrando en la busqueda);
// si no viene o el jugador no tiene perfil en ese juego, se muestra el primero.
const JugadorPerfilPage = () => {
  const { jugadorId } = useParams();
  const [searchParams] = useSearchParams();
  const { currentUserId, iniciarChat } = useChat();
  const { perfil, cargando, error, recargar } = usePerfilJugador(jugadorId);

  // null = el juego que llega por la URL (o el primero).
  const [juegoElegidoId, setJuegoElegidoId] = useState(null);
  const [abriendoChat, setAbriendoChat] = useState(false);

  // US 50 - Un admin puede dar de baja la cuenta desde el perfil. Se guarda
  // el id dado de baja (no un booleano) para que el aviso no quede pegado al
  // pasar a otro perfil sin desmontar la pagina.
  const { user } = useAuth();
  const baja = useDarDeBajaUsuario();
  const [idDadoDeBaja, setIdDadoDeBaja] = useState(null);
  const [mensajeBaja, setMensajeBaja] = useState("");

  const handleEnviarMensaje = async () => {
    setAbriendoChat(true);
    await iniciarChat(perfil.user_id);
    setAbriendoChat(false);
  };

  const handleConfirmarBaja = async () => {
    const idObjetivo = baja.usuario?.user_id;
    const mensaje = await baja.confirmar();
    if (!mensaje) return;

    setMensajeBaja(mensaje);
    setIdDadoDeBaja(idObjetivo);
  };

  let contenido;

  if (idDadoDeBaja !== null && String(idDadoDeBaja) === String(jugadorId)) {
    contenido = (
      <AvisoComponent
        titulo="Cuenta dada de baja"
        accion={
          <Link
            to="/app/jugadores"
            className="text-sm font-semibold text-ganker-orange-light hover:underline"
          >
            Ir a Buscar jugadores
          </Link>
        }
      >
        {mensajeBaja}
      </AvisoComponent>
    );
  } else if (cargando) {
    contenido = <p className="text-sm text-ganker-muted">Cargando perfil...</p>;
  } else if (error) {
    contenido = (
      <AvisoComponent
        titulo={error}
        accion={
          <Link
            to="/app/jugadores"
            className="text-sm font-semibold text-ganker-orange-light hover:underline"
          >
            Ir a Buscar jugadores
          </Link>
        }
      />
    );
  } else {
    const esUnoMismo = perfil.user_id === currentUserId;
    const conexionReciente = formatearConexionReciente(perfil.last_connection);
    const perfiles = perfil.profiles ?? [];
    const idBuscado = juegoElegidoId ?? searchParams.get("juego");
    const perfilActivo =
      perfiles.find((p) => String(p.videogame.id) === String(idBuscado)) ??
      perfiles[0];

    contenido = (
      <div className="space-y-6">
        <div className="flex flex-col gap-5 rounded-2xl border border-white/10 bg-ganker-surface p-5 sm:flex-row sm:items-center sm:p-6">
          <div className="flex h-20 w-20 shrink-0 items-center justify-center overflow-hidden rounded-full border border-ganker-purple/40 bg-ganker-surface-light text-2xl font-semibold text-ganker-text">
            <AvatarUsuarioComponent user={perfil} />
          </div>

          <div className="min-w-0 flex-1">
            <h1 className="truncate font-heading text-2xl font-bold text-ganker-text sm:text-3xl">
              {perfil.name}
            </h1>
            <p className="truncate text-sm text-ganker-muted">
              @{perfil.username}
            </p>
            {conexionReciente && (
              <p className="mt-1 text-xs text-ganker-muted/80">
                {conexionReciente}
              </p>
            )}
          </div>

          <div className="flex shrink-0 flex-wrap items-center gap-2">
            {esUnoMismo ? (
              <Link
                to="/app/perfil"
                className="rounded-xl border border-white/10 bg-ganker-surface-light px-5 py-3 text-center text-sm font-semibold text-ganker-text transition hover:border-ganker-purple/40 hover:bg-ganker-purple/20"
              >
                Editar mis perfiles
              </Link>
            ) : (
              <>
                {/* US 35 - Reportar a otro jugador desde su perfil. */}
                <BotonReportarJugadorComponent
                  jugador={perfil}
                  currentUserId={currentUserId}
                  variante="perfil"
                />
                <button
                  type="button"
                  onClick={handleEnviarMensaje}
                  disabled={abriendoChat}
                  className="shrink-0 cursor-pointer rounded-xl bg-gradient-to-r from-ganker-orange to-ganker-purple px-5 py-3 text-sm font-semibold text-white transition hover:opacity-90 disabled:cursor-not-allowed disabled:opacity-60"
                >
                  {abriendoChat ? "Abriendo chat..." : "Enviar mensaje"}
                </button>
              </>
            )}
          </div>
        </div>

        {/* Discord: solo aparece si el jugador lo comparte con quien mira */}
        {!esUnoMismo && <DiscordJugadorComponent userId={perfil.user_id} />}

        {/* US 50 - Solo admin/owner, y nunca sobre la propia cuenta. */}
        {esAdmin(user) && !esUnoMismo && !baja.esUnoMismo(perfil) && (
          <div className="flex flex-col gap-3 rounded-2xl border border-ganker-error/30 bg-ganker-surface p-5 sm:flex-row sm:items-center sm:justify-between sm:p-6">
            <div>
              <h2 className="font-heading text-lg font-semibold text-ganker-text">
                Administración
              </h2>
              <p className="mt-1 text-sm text-ganker-muted">
                Dar de baja esta cuenta y todos sus perfiles de juego.
              </p>
            </div>
            <button
              type="button"
              onClick={() => baja.abrir(perfil)}
              className={`shrink-0 ${CLASES_BOTON_ELIMINAR}`}
            >
              Dar de baja cuenta
            </button>
          </div>
        )}

        <div className="rounded-2xl border border-white/10 bg-ganker-surface p-5 sm:p-6">
          <h2 className="font-heading text-xl font-semibold text-ganker-text">
            Perfiles de juego
          </h2>

          {perfiles.length === 0 ? (
            <p className="mt-4 text-sm text-ganker-muted">
              {esUnoMismo
                ? "Todavía no tenés perfiles de juego."
                : "Este jugador todavía no tiene perfiles de juego."}
            </p>
          ) : (
            <>
              <div
                role="tablist"
                aria-label="Videojuegos del jugador"
                className="mt-4 flex flex-wrap gap-2 border-b border-white/10 pb-4"
              >
                {perfiles.map((p) => {
                  const activo =
                    p.game_profile_id === perfilActivo.game_profile_id;
                  return (
                    <button
                      key={p.game_profile_id}
                      type="button"
                      role="tab"
                      aria-selected={activo}
                      onClick={() => setJuegoElegidoId(p.videogame.id)}
                      className={[
                        "flex cursor-pointer items-center gap-2 rounded-xl border px-3 py-2 text-sm font-semibold transition",
                        activo
                          ? "border-ganker-purple/60 bg-ganker-purple/20 text-ganker-text"
                          : "border-white/10 bg-ganker-surface-light text-ganker-muted hover:text-ganker-text",
                      ].join(" ")}
                    >
                      <IconoChicoComponent
                        src={p.videogame.icon_url}
                        className="h-6 w-6 rounded-md"
                      />
                      {p.videogame.name}
                    </button>
                  );
                })}
              </div>

              <div role="tabpanel" className="mt-5">
                <PerfilDeJuegoDetalleComponent
                  perfil={perfilActivo}
                  esPropio={esUnoMismo}
                  onRangoActualizado={recargar}
                />
              </div>
            </>
          )}
        </div>
      </div>
    );
  }

  return (
    <section className="min-h-full bg-ganker-bg px-4 py-6 sm:px-6 lg:px-8">
      <div className="mx-auto w-full max-w-5xl">{contenido}</div>

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

export default JugadorPerfilPage;
