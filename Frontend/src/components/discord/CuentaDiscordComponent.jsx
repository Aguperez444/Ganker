import { useEffect, useId, useState } from "react";
import {
  getDiscordAuthorizeUrl,
  getMyDiscord,
  unlinkDiscord,
  updateDiscordVisibility,
} from "../../api/discordApi";
import {
  VISIBILIDADES_DISCORD,
  VISIBILIDAD_POR_DEFECTO,
  guardarVisibilidadPendiente,
  tomarMensajeDiscord,
} from "../../utils/discord";
import { logError } from "../../utils/logs";
import IconoChicoComponent from "../common/IconoChicoComponent";

const CLASES_SELECT =
  "w-full rounded-lg border border-white/10 bg-ganker-surface-light px-3 py-2.5 text-sm text-ganker-text focus:border-ganker-purple focus:ring-2 focus:ring-ganker-purple focus:outline-none disabled:opacity-60";

function mensajeDeError(error, porDefecto) {
  return error.response?.data?.error ?? porDefecto;
}

// Funcion de modulo por el mismo motivo que cargarEquipo en useEquipo.js
// (regla set-state-in-effect).
async function cargarCuenta({ setCuenta, setError }) {
  try {
    setCuenta(await getMyDiscord());
  } catch (error) {
    logError("Error al cargar la cuenta de Discord:", error);
    setCuenta({ linked: false });
    setError("No se pudo cargar tu cuenta de Discord.");
  }
}

// Seccion "Discord" de Mi cuenta: conectar (OAuth2 en discord.com), elegir
// quien la ve y desconectar. El resultado de la conexion lo deja
// DiscordCallbackPage en sessionStorage antes de volver aca.
const CuentaDiscordComponent = () => {
  const [cuenta, setCuenta] = useState(null);
  const [visibilidad, setVisibilidad] = useState(VISIBILIDAD_POR_DEFECTO);
  const [enCurso, setEnCurso] = useState(false);
  const [error, setError] = useState("");
  const [mensaje, setMensaje] = useState(() => tomarMensajeDiscord());
  const idVisibilidad = useId();

  useEffect(() => {
    cargarCuenta({ setCuenta, setError });
  }, []);

  const conectar = async () => {
    try {
      setEnCurso(true);
      setError("");
      const url = await getDiscordAuthorizeUrl();
      guardarVisibilidadPendiente(visibilidad);
      window.location.assign(url);
    } catch (error) {
      setError(
        mensajeDeError(error, "No se pudo iniciar la conexión con Discord.")
      );
      setEnCurso(false);
    }
  };

  const cambiarVisibilidad = async (nueva) => {
    try {
      setEnCurso(true);
      setError("");
      setMensaje(null);
      setCuenta(await updateDiscordVisibility(nueva));
      setMensaje({
        tipo: "exito",
        texto: "Se actualizó quién puede ver tu Discord.",
      });
    } catch (error) {
      setError(mensajeDeError(error, "No se pudo cambiar la visibilidad."));
    } finally {
      setEnCurso(false);
    }
  };

  const desconectar = async () => {
    try {
      setEnCurso(true);
      setError("");
      setMensaje(null);
      const respuesta = await unlinkDiscord();
      setCuenta({ linked: false });
      setMensaje({ tipo: "exito", texto: respuesta.message });
    } catch (error) {
      setError(mensajeDeError(error, "No se pudo desconectar Discord."));
    } finally {
      setEnCurso(false);
    }
  };

  return (
    <section className="rounded-2xl border border-white/10 bg-ganker-surface p-6">
      <h2 className="font-heading text-lg font-semibold text-ganker-text">
        Discord
      </h2>
      <p className="mt-1 text-sm text-ganker-muted">
        Conectá tu cuenta de Discord para que otros jugadores puedan escribirte
        más rápido por ahí.
      </p>

      {mensaje && (
        <div
          className={`mt-4 rounded-lg border px-4 py-3 text-sm ${
            mensaje.tipo === "error"
              ? "border-ganker-error/20 bg-ganker-error/10 text-ganker-error"
              : "border-ganker-success/20 bg-ganker-success/10 text-ganker-success"
          }`}
        >
          {mensaje.tipo === "error" ? mensaje.texto : `✓ ${mensaje.texto}`}
        </div>
      )}

      {error && (
        <div className="mt-4 rounded-lg border border-ganker-error/20 bg-ganker-error/10 px-4 py-3">
          <p className="text-sm text-ganker-error">{error}</p>
        </div>
      )}

      {cuenta === null ? (
        <p className="mt-4 text-sm text-ganker-muted">Cargando...</p>
      ) : cuenta.linked ? (
        <div className="mt-4 space-y-4">
          <div className="flex items-center gap-3">
            <IconoChicoComponent
              src={cuenta.avatar_url}
              alt=""
              className="h-12 w-12 shrink-0 rounded-full"
              placeholder
            />
            <div className="min-w-0">
              <p className="truncate font-semibold text-ganker-text">
                {cuenta.display_name}
              </p>
              <p className="truncate text-sm text-ganker-muted">
                @{cuenta.username}
              </p>
            </div>
          </div>

          <div className="grid gap-3 sm:grid-cols-[minmax(0,1fr)_auto] sm:items-end">
            <div>
              <label
                htmlFor={idVisibilidad}
                className="mb-1 block text-xs font-semibold text-ganker-text"
              >
                Quién puede ver tu Discord
              </label>
              <select
                id={idVisibilidad}
                value={cuenta.visibility}
                onChange={(e) => cambiarVisibilidad(e.target.value)}
                disabled={enCurso}
                className={CLASES_SELECT}
              >
                {VISIBILIDADES_DISCORD.map((v) => (
                  <option key={v.value} value={v.value}>
                    {v.label}
                  </option>
                ))}
              </select>
            </div>

            <button
              type="button"
              onClick={desconectar}
              disabled={enCurso}
              className="cursor-pointer rounded-lg border border-ganker-error/40 px-4 py-2.5 text-sm font-semibold text-ganker-error transition hover:bg-ganker-error/10 disabled:cursor-not-allowed disabled:opacity-50"
            >
              Desconectar
            </button>
          </div>
        </div>
      ) : (
        <div className="mt-4 grid gap-3 sm:grid-cols-[minmax(0,1fr)_auto] sm:items-end">
          <div>
            <label
              htmlFor={idVisibilidad}
              className="mb-1 block text-xs font-semibold text-ganker-text"
            >
              Quién va a poder verlo
            </label>
            <select
              id={idVisibilidad}
              value={visibilidad}
              onChange={(e) => setVisibilidad(e.target.value)}
              disabled={enCurso}
              className={CLASES_SELECT}
            >
              {VISIBILIDADES_DISCORD.map((v) => (
                <option key={v.value} value={v.value}>
                  {v.label}
                </option>
              ))}
            </select>
          </div>

          <button
            type="button"
            onClick={conectar}
            disabled={enCurso}
            className="cursor-pointer rounded-lg bg-[#5865F2] px-5 py-2.5 text-sm font-semibold text-white transition hover:bg-[#4752C4] disabled:cursor-not-allowed disabled:opacity-50"
          >
            {enCurso ? "Abriendo Discord..." : "Conectar con Discord"}
          </button>
        </div>
      )}
    </section>
  );
};

export default CuentaDiscordComponent;
