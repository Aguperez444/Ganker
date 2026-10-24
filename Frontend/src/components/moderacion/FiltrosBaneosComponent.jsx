import CampoFormularioComponent from "../common/CampoFormularioComponent";

const CLASES_INPUT =
  "w-full rounded-lg border border-white/10 bg-ganker-surface-light px-3 py-2.5 text-sm text-ganker-text [color-scheme:dark] focus:border-ganker-purple focus:ring-2 focus:ring-ganker-purple focus:outline-none disabled:opacity-60";

// Buscar jugadores baneados: filtros por jugador, admin, motivo y rangos de
// fecha de baneo y de vencimiento. Todos son opcionales y se combinan en el
// backend. `filtros` usa la forma de FILTROS_BANEOS_VACIOS (utils/baneos.js).
const FiltrosBaneosComponent = ({
  filtros,
  errores = {},
  cargando,
  onChange,
  onBuscar,
  onLimpiar,
}) => {
  const handleSubmit = (e) => {
    e.preventDefault();
    onBuscar();
  };

  const campoTexto = (campo, id, placeholder) => (
    <input
      id={id}
      type="text"
      autoComplete="off"
      spellCheck={false}
      value={filtros[campo]}
      onChange={(e) => onChange(campo, e.target.value)}
      placeholder={placeholder}
      disabled={cargando}
      className={CLASES_INPUT}
    />
  );

  const rangoFechas = (prefijo, campoDesde, campoHasta, etiqueta) => (
    <div className="grid grid-cols-2 gap-3">
      <CampoFormularioComponent
        id={`${prefijo}-desde`}
        label={`${etiqueta} desde`}
      >
        <input
          id={`${prefijo}-desde`}
          type="date"
          value={filtros[campoDesde]}
          max={filtros[campoHasta] || undefined}
          onChange={(e) => onChange(campoDesde, e.target.value)}
          disabled={cargando}
          className={CLASES_INPUT}
        />
      </CampoFormularioComponent>
      <CampoFormularioComponent id={`${prefijo}-hasta`} label="Hasta">
        <input
          id={`${prefijo}-hasta`}
          type="date"
          value={filtros[campoHasta]}
          min={filtros[campoDesde] || undefined}
          onChange={(e) => onChange(campoHasta, e.target.value)}
          disabled={cargando}
          className={CLASES_INPUT}
        />
      </CampoFormularioComponent>
    </div>
  );

  return (
    <form onSubmit={handleSubmit} noValidate className="mt-5 space-y-4">
      <div className="grid gap-4 sm:grid-cols-2">
        <CampoFormularioComponent id="baneos-usuario" label="Jugador baneado">
          {campoTexto("usuario", "baneos-usuario", "Ej. pedro")}
        </CampoFormularioComponent>
        <CampoFormularioComponent id="baneos-admin" label="Baneado por">
          {campoTexto("admin", "baneos-admin", "Nombre de usuario del admin")}
        </CampoFormularioComponent>
      </div>

      <CampoFormularioComponent
        id="baneos-motivo"
        label="Motivo"
        ayuda="Tiene que coincidir con el motivo completo del baneo."
      >
        {campoTexto("motivo", "baneos-motivo", "Ej. Uso de cheats")}
      </CampoFormularioComponent>

      <div className="grid gap-4 sm:grid-cols-2">
        <div>
          {rangoFechas(
            "baneos-creado",
            "creadoDesde",
            "creadoHasta",
            "Baneado"
          )}
          {errores.creado && (
            <p className="mt-1 text-xs text-ganker-error">{errores.creado}</p>
          )}
        </div>
        <div>
          {rangoFechas(
            "baneos-vencimiento",
            "vencimientoDesde",
            "vencimientoHasta",
            "Vence"
          )}
          {errores.vencimiento && (
            <p className="mt-1 text-xs text-ganker-error">
              {errores.vencimiento}
            </p>
          )}
        </div>
      </div>

      <div className="flex flex-wrap justify-end gap-3">
        <button
          type="button"
          onClick={onLimpiar}
          disabled={cargando}
          className="cursor-pointer rounded-lg border border-white/10 px-4 py-2.5 text-sm font-semibold text-ganker-muted transition hover:bg-white/5 disabled:cursor-not-allowed disabled:opacity-50"
        >
          Limpiar filtros
        </button>
        <button
          type="submit"
          disabled={cargando}
          className="cursor-pointer rounded-lg bg-gradient-to-r from-ganker-orange via-ganker-orange-light to-ganker-purple px-4 py-2.5 text-sm font-semibold text-white shadow-lg transition hover:opacity-90 disabled:cursor-not-allowed disabled:opacity-50"
        >
          {cargando ? "Buscando..." : "Buscar"}
        </button>
      </div>
    </form>
  );
};

export default FiltrosBaneosComponent;
