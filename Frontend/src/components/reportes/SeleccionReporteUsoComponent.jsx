import SelectorJuegoComponent from "../games/SelectorJuegoComponent";

// US 38 - Videojuego ("" = todos) y tipo de analisis del reporte de uso. Los
// tipos (rangos, personajes, equipos) vienen del catalogo del backend.
const SeleccionReporteUsoComponent = ({
  juegos,
  tipos,
  videogameId,
  tipo,
  deshabilitado,
  onJuegoChange,
  onTipoChange,
}) => (
  <>
    <div>
      <p className="mb-2 block text-xs font-semibold text-ganker-text">
        Videojuego
      </p>
      <SelectorJuegoComponent
        etiqueta="Videojuego"
        juegos={juegos}
        value={videogameId}
        onChange={onJuegoChange}
        disabled={deshabilitado}
        opcionTodos="Todos los videojuegos"
      />
    </div>

    <fieldset>
      <legend className="mb-2 text-xs font-semibold text-ganker-text">
        Tipo de análisis
      </legend>
      <div className="grid gap-2 sm:grid-cols-3">
        {tipos.map((opcion) => {
          const elegido = opcion.value === tipo;
          const idDescripcion = `reporte-uso-tipo-${opcion.value}-descripcion`;
          // El nombre accesible del radio es solo el titulo; la descripcion
          // se asocia aparte con aria-describedby.
          return (
            <div
              key={opcion.value}
              className={[
                "flex flex-col gap-1 rounded-xl border p-3 transition",
                elegido
                  ? "border-ganker-purple/60 bg-ganker-purple/20"
                  : "border-white/10 bg-ganker-surface-light hover:border-ganker-purple/40",
              ].join(" ")}
            >
              <label className="flex cursor-pointer items-center gap-2 text-sm font-semibold text-ganker-text">
                <input
                  type="radio"
                  name="reporte-uso-tipo"
                  value={opcion.value}
                  checked={elegido}
                  onChange={() => onTipoChange(opcion.value)}
                  disabled={deshabilitado}
                  aria-describedby={idDescripcion}
                  className="accent-ganker-purple"
                />
                {opcion.label}
              </label>
              <span id={idDescripcion} className="text-xs text-ganker-muted">
                {opcion.description}
              </span>
            </div>
          );
        })}
      </div>
    </fieldset>
  </>
);

export default SeleccionReporteUsoComponent;
