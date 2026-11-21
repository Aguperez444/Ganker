import { useEffect, useState } from "react";
import { buscarApelaciones } from "../../api/apelacionesApi";
import {
  ESTADOS_APELACION,
  mensajeErrorApelacion,
} from "../../utils/apelaciones";
import { formatearFechaBaneo } from "../../utils/baneos";
import ModalHistorialSancionesComponent from "./ModalHistorialSancionesComponent";
import EstadoApelacionComponent from "./EstadoApelacionComponent";

export default function ListaApelacionesComponent({ onResuelta, miId }) {
  const [filtros, setFiltros] = useState({ username: "", estado: "" });
  const [busqueda, setBusqueda] = useState({
    username: "",
    estado: "",
    pagina: 0,
    version: 0,
  });
  const [consulta, setConsulta] = useState({});
  const [seleccionada, setSeleccionada] = useState(null);
  const cargando = consulta.busqueda !== busqueda;

  useEffect(() => {
    let activo = true;
    buscarApelaciones({
      username: busqueda.username,
      estado: busqueda.estado,
      skip: busqueda.pagina * 10,
      limit: 11,
    }).then(
      (filas) => {
        if (activo)
          setConsulta({
            filas: filas.slice(0, 10),
            hayMas: filas.length > 10,
            busqueda,
          });
      },
      (error) => {
        if (activo)
          setConsulta({ error: mensajeErrorApelacion(error), busqueda });
      }
    );
    return () => {
      activo = false;
    };
  }, [busqueda]);

  const recargar = () =>
    setBusqueda((anterior) => ({ ...anterior, version: anterior.version + 1 }));
  return (
    <div className="mt-5 space-y-4">
      <form
        className="grid gap-3 sm:grid-cols-[1fr_1fr_auto] sm:items-end"
        onSubmit={(evento) => {
          evento.preventDefault();
          setBusqueda({
            ...filtros,
            username: filtros.username.trim().replace(/^@/, ""),
            pagina: 0,
            version: busqueda.version + 1,
          });
        }}
      >
        <label className="text-xs font-semibold text-ganker-text">
          Jugador que apeló
          <input
            value={filtros.username}
            onChange={(evento) =>
              setFiltros((previos) => ({
                ...previos,
                username: evento.target.value,
              }))
            }
            className="mt-1 w-full rounded-lg border border-white/10 bg-ganker-surface-light px-3 py-2 text-sm"
          />
        </label>
        <label className="text-xs font-semibold text-ganker-text">
          Estado de la apelación
          <select
            value={filtros.estado}
            onChange={(evento) =>
              setFiltros((previos) => ({
                ...previos,
                estado: evento.target.value,
              }))
            }
            className="mt-1 w-full rounded-lg border border-white/10 bg-ganker-surface-light px-3 py-2 text-sm"
          >
            <option value="">Todas</option>
            {Object.entries(ESTADOS_APELACION).map(([valor, etiqueta]) => (
              <option key={valor} value={valor}>
                {etiqueta}
              </option>
            ))}
          </select>
        </label>
        <button
          type="submit"
          disabled={cargando}
          className="cursor-pointer rounded-lg bg-ganker-purple px-4 py-2 text-sm font-semibold text-white disabled:opacity-50"
        >
          Buscar apelaciones
        </button>
      </form>
      {cargando ? (
        <p className="text-sm text-ganker-muted">Cargando apelaciones...</p>
      ) : consulta.error ? (
        <div role="alert" className="text-sm text-ganker-error">
          <p>{consulta.error}</p>
          <button
            type="button"
            onClick={recargar}
            className="mt-2 cursor-pointer underline"
          >
            Volver a intentar
          </button>
        </div>
      ) : consulta.filas.length === 0 ? (
        <p className="text-sm text-ganker-muted">
          No hay apelaciones que coincidan con la búsqueda.
        </p>
      ) : (
        <ul className="divide-y divide-white/10 rounded-xl border border-white/10">
          {consulta.filas.map((apelacion) => (
            <li
              key={apelacion.id}
              className="flex flex-col justify-between gap-3 p-4 sm:flex-row sm:items-center"
            >
              <div className="min-w-0 flex-1">
                <div className="flex items-center gap-3">
                  <p className="min-w-0 truncate font-semibold text-ganker-text">
                    @{apelacion.ban.username}
                  </p>
                  <EstadoApelacionComponent estado={apelacion.status} />
                </div>
                <p className="mt-1 truncate text-sm text-ganker-muted">
                  {apelacion.ban.reason}
                </p>
                <p className="mt-1 text-xs text-ganker-muted">
                  Apeló el {formatearFechaBaneo(apelacion.created_at)}
                </p>
              </div>
              <button
                type="button"
                onClick={() => setSeleccionada(apelacion.id)}
                aria-label={`Ver apelación de @${apelacion.ban.username}`}
                className="shrink-0 cursor-pointer rounded-lg border border-ganker-purple-light/30 px-3 py-2 text-sm font-semibold text-ganker-purple-light"
              >
                Ver apelación
              </button>
            </li>
          ))}
        </ul>
      )}
      <nav
        aria-label="Paginación de apelaciones"
        className="flex items-center justify-between gap-3 text-sm text-ganker-muted"
      >
        <button
          type="button"
          disabled={cargando || busqueda.pagina === 0}
          onClick={() =>
            setBusqueda((previa) => ({ ...previa, pagina: previa.pagina - 1 }))
          }
          className="cursor-pointer rounded-lg border border-white/10 px-3 py-2 disabled:opacity-50"
        >
          Anterior
        </button>
        <p>Página {busqueda.pagina + 1}</p>
        <button
          type="button"
          disabled={cargando || !consulta.hayMas}
          onClick={() =>
            setBusqueda((previa) => ({ ...previa, pagina: previa.pagina + 1 }))
          }
          className="cursor-pointer rounded-lg border border-white/10 px-3 py-2 disabled:opacity-50"
        >
          Siguiente
        </button>
      </nav>
      {seleccionada && (
        <ModalHistorialSancionesComponent
          apelacionId={seleccionada}
          miId={miId}
          onClose={() => setSeleccionada(null)}
          onResuelta={(decision) => {
            setSeleccionada(null);
            recargar();
            onResuelta(decision);
          }}
        />
      )}
    </div>
  );
}
