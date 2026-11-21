import { useEffect, useState } from "react";
import { Link } from "react-router-dom";
import { obtenerReporteDenuncias } from "../../api/reportesApi";
import ModalRevisionDenunciaComponent from "../../components/moderacion/ModalRevisionDenunciaComponent";
import ModalHistorialSancionesComponent from "../../components/moderacion/ModalHistorialSancionesComponent";
import { useAuth } from "../../context/AuthContext";
import { obtenerIdUsuarioDesdeToken } from "../../utils/jwt";
import ResumenModeracionComponent from "../../components/reportes/ResumenModeracionComponent";
import {
  parametrosReporteDenuncias,
  periodoReciente,
} from "../../utils/reporteDenuncias";

const CONTROL =
  "mt-1 w-full rounded-lg border border-white/10 bg-ganker-surface-light px-3 py-2 text-sm text-ganker-text outline-none focus:border-ganker-purple-light [color-scheme:dark]";

export default function ReporteDenunciasPage() {
  const { tokens } = useAuth();
  const miId = obtenerIdUsuarioDesdeToken(tokens?.access_token);
  const [seleccion, setSeleccion] = useState(null);
  const [mensaje, setMensaje] = useState("");
  const [filtros, setFiltros] = useState(() => periodoReciente(30));
  const [parametros, setParametros] = useState(() =>
    parametrosReporteDenuncias(periodoReciente(30))
  );
  const [estado, setEstado] = useState({
    reporte: null,
    cargando: true,
    error: "",
  });
  const [errorFechas, setErrorFechas] = useState("");

  useEffect(() => {
    let activo = true;
    obtenerReporteDenuncias(parametros)
      .then((reporte) => {
        if (activo) setEstado({ reporte, cargando: false, error: "" });
      })
      .catch((error) => {
        const mensaje = error?.response?.data?.error;
        if (activo)
          setEstado({
            reporte: null,
            cargando: false,
            error:
              typeof mensaje === "string"
                ? mensaje
                : "No se pudo generar el reporte de denuncias.",
          });
      });
    return () => {
      activo = false;
    };
  }, [parametros]);

  function generar(evento) {
    evento.preventDefault();
    if (filtros.desde && filtros.hasta && filtros.desde > filtros.hasta) {
      setErrorFechas("La fecha inicial no puede ser posterior a la final.");
      return;
    }
    setErrorFechas("");
    setMensaje("");
    setEstado({ reporte: null, cargando: true, error: "" });
    setParametros(parametrosReporteDenuncias(filtros));
  }

  function actualizar(mensaje) {
    setSeleccion(null);
    setMensaje(mensaje);
    setEstado({ reporte: null, cargando: true, error: "" });
    setParametros((actuales) => ({ ...actuales }));
  }

  return (
    <section className="min-h-full bg-ganker-bg p-4 sm:p-6">
      <div className="mx-auto max-w-6xl space-y-6">
        <header className="flex flex-wrap items-start justify-between gap-4">
          <div>
            <p className="text-xs font-semibold tracking-wider text-ganker-purple-light uppercase">
              Administración · Moderación
            </p>
            <h1 className="mt-2 font-heading text-3xl font-bold text-ganker-text">
              Reporte de denuncias
            </h1>
            <p className="mt-2 text-sm text-ganker-muted">
              Información para evaluar la convivencia y la gestión de la
              moderación.
            </p>
          </div>
          <Link
            to="/app/admin/moderacion"
            className="rounded-lg border border-white/10 px-4 py-2 text-sm font-semibold text-ganker-purple-light hover:bg-white/5"
          >
            ← Volver a moderación
          </Link>
        </header>
        <form
          onSubmit={generar}
          className="space-y-4 rounded-xl border border-white/10 bg-ganker-surface p-5"
        >
          <div className="flex flex-wrap gap-2" aria-label="Períodos rápidos">
            {[
              [7, "7 días"],
              [30, "30 días"],
              [90, "90 días"],
              [null, "Todo el historial"],
            ].map(([dias, etiqueta]) => (
              <button
                key={etiqueta}
                type="button"
                onClick={() => {
                  setFiltros({
                    ...periodoReciente(dias),
                    limite: filtros.limite,
                  });
                  setErrorFechas("");
                }}
                className="cursor-pointer rounded-lg border border-white/10 px-3 py-1.5 text-xs font-semibold text-ganker-muted hover:border-ganker-purple-light hover:text-ganker-text"
              >
                {etiqueta}
              </button>
            ))}
          </div>
          <div className="grid items-end gap-4 sm:grid-cols-2 lg:grid-cols-4">
            <label className="text-sm text-ganker-muted">
              Desde
              <input
                type="date"
                className={CONTROL}
                value={filtros.desde}
                onChange={(e) =>
                  setFiltros({ ...filtros, desde: e.target.value })
                }
              />
            </label>
            <label className="text-sm text-ganker-muted">
              Hasta (inclusive)
              <input
                type="date"
                className={CONTROL}
                value={filtros.hasta}
                onChange={(e) =>
                  setFiltros({ ...filtros, hasta: e.target.value })
                }
              />
            </label>
            <label className="text-sm text-ganker-muted">
              Jugadores por ranking
              <select
                className={CONTROL}
                value={filtros.limite}
                onChange={(e) =>
                  setFiltros({ ...filtros, limite: e.target.value })
                }
              >
                {[10, 25, 50].map((cantidad) => (
                  <option key={cantidad} value={cantidad}>
                    {cantidad} jugadores
                  </option>
                ))}
              </select>
            </label>
            <button
              type="submit"
              disabled={estado.cargando}
              className="cursor-pointer rounded-lg bg-ganker-purple px-4 py-2.5 text-sm font-semibold text-white hover:bg-ganker-purple/80 disabled:cursor-wait disabled:opacity-50"
            >
              {estado.cargando ? "Generando..." : "Generar reporte"}
            </button>
          </div>
          {errorFechas && (
            <p role="alert" className="text-sm text-ganker-error">
              {errorFechas}
            </p>
          )}
          <p className="text-xs text-ganker-muted">
            Dejá las fechas vacías para consultar todo el historial. Las fechas
            filtran cuándo se creó cada denuncia, baneo o apelación; los estados
            reflejan su situación actual.
          </p>
        </form>
        {mensaje && (
          <p
            role="status"
            className="rounded-xl border border-ganker-success/20 bg-ganker-success/10 p-4 text-sm text-ganker-success"
          >
            {mensaje}
          </p>
        )}
        {estado.cargando && (
          <p
            role="status"
            className="py-10 text-center text-sm text-ganker-muted"
          >
            Preparando el informe de moderación...
          </p>
        )}
        {estado.error && (
          <div
            role="alert"
            className="rounded-xl border border-ganker-error/30 p-5 text-sm text-ganker-error"
          >
            {estado.error}
            <button
              type="button"
              onClick={() => {
                setEstado({ reporte: null, cargando: true, error: "" });
                setParametros({ ...parametros });
              }}
              className="ml-3 cursor-pointer font-semibold underline"
            >
              Reintentar
            </button>
          </div>
        )}
        {estado.reporte && (
          <>
            <div className="rounded-xl border border-white/10 bg-white/5 p-4 text-xs text-ganker-muted">
              <p>
                Período aplicado:{" "}
                {estado.reporte.start_date
                  ? new Date(estado.reporte.start_date).toLocaleString("es-AR")
                  : "Desde el inicio"}{" "}
                — {new Date(estado.reporte.end_date).toLocaleString("es-AR")}{" "}
                (límite final exclusivo).
              </p>
              <p className="mt-1">
                Actualizado:{" "}
                {new Date(estado.reporte.generated_at).toLocaleString("es-AR")}.
              </p>
            </div>
            <ResumenModeracionComponent
              reporte={estado.reporte}
              onVerDenuncias={(jugador) =>
                setSeleccion({ tipo: "denuncias", jugador })
              }
              onVerBaneos={(jugador) =>
                setSeleccion({ tipo: "baneos", jugador })
              }
            />
          </>
        )}
      </div>
      {seleccion?.tipo === "denuncias" && (
        <ModalRevisionDenunciaComponent
          jugador={seleccion.jugador}
          miId={miId}
          onClose={() => setSeleccion(null)}
          onBaneado={actualizar}
          onDesestimada={actualizar}
        />
      )}
      {seleccion?.tipo === "baneos" && (
        <ModalHistorialSancionesComponent
          jugador={seleccion.jugador}
          miId={miId}
          onClose={() => setSeleccion(null)}
          onResuelta={(decision) =>
            actualizar(
              decision === "accepted"
                ? "Apelación aceptada. Se levantó el baneo del jugador."
                : "Apelación rechazada. Se mantiene el baneo."
            )
          }
        />
      )}
    </section>
  );
}
