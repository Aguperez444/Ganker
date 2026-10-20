import { useState } from "react";

const TAMANIO = 160;
const RADIO = 58;
const GROSOR = 24;
const CIRCUNFERENCIA = 2 * Math.PI * RADIO;
// Separacion entre porciones, del color de la superficie.
const SEPARACION = 2;

function formatearPorcentaje(proporcion) {
  return `${Math.round(proporcion * 1000) / 10}%`;
}

// Torta (dona) de un reporte. `segmentos`: [{ clave, nombre, valor,
// proporcion, color }], ya agrupados (ver utils/graficosReporte.js). Al pasar
// el mouse o enfocar una porcion con el teclado, el centro muestra su nombre,
// cantidad y porcentaje; si no, el total.
const GraficoTortaComponent = ({ titulo, subtitulo, segmentos, unidad }) => {
  const [activa, setActiva] = useState(null);
  const total = segmentos.reduce((acc, s) => acc + s.valor, 0);
  const seleccionada = segmentos.find((s) => s.clave === activa);
  const separacion = segmentos.length > 1 ? SEPARACION : 0;

  // Cada arco arranca donde terminan los anteriores (suma de sus largos).
  const arcos = segmentos.map((segmento, indice) => {
    const largo = segmento.proporcion * CIRCUNFERENCIA;
    const inicio = segmentos
      .slice(0, indice)
      .reduce((acc, s) => acc + s.proporcion * CIRCUNFERENCIA, 0);
    return {
      ...segmento,
      visible: Math.max(largo - separacion, 0.01),
      desplazamiento: -inicio,
    };
  });

  const descripcion = segmentos
    .map(
      (s) =>
        `${s.nombre}: ${s.valor} ${unidad} (${formatearPorcentaje(s.proporcion)})`
    )
    .join(", ");

  return (
    <figure className="flex flex-col items-center gap-2">
      <figcaption className="text-center">
        <p className="text-sm font-semibold text-ganker-text">{titulo}</p>
        {subtitulo && <p className="text-xs text-ganker-muted">{subtitulo}</p>}
      </figcaption>

      <div className="relative">
        <svg
          width={TAMANIO}
          height={TAMANIO}
          viewBox={`0 0 ${TAMANIO} ${TAMANIO}`}
          role="img"
          aria-label={`${titulo}. ${descripcion}`}
          className="-rotate-90"
        >
          <circle
            cx={TAMANIO / 2}
            cy={TAMANIO / 2}
            r={RADIO}
            fill="none"
            stroke="rgba(255,255,255,0.06)"
            strokeWidth={GROSOR}
          />
          {arcos.map((arco) => (
            <circle
              key={arco.clave}
              cx={TAMANIO / 2}
              cy={TAMANIO / 2}
              r={RADIO}
              fill="none"
              stroke={arco.color}
              strokeWidth={activa === arco.clave ? GROSOR + 6 : GROSOR}
              strokeDasharray={`${arco.visible} ${CIRCUNFERENCIA - arco.visible}`}
              strokeDashoffset={arco.desplazamiento}
              opacity={activa && activa !== arco.clave ? 0.45 : 1}
              tabIndex={0}
              aria-label={`${arco.nombre}: ${arco.valor} ${unidad}, ${formatearPorcentaje(arco.proporcion)}`}
              onMouseEnter={() => setActiva(arco.clave)}
              onMouseLeave={() => setActiva(null)}
              onFocus={() => setActiva(arco.clave)}
              onBlur={() => setActiva(null)}
              className="cursor-pointer transition-[stroke-width,opacity] duration-150 outline-none"
            >
              <title>
                {`${arco.nombre}: ${arco.valor} ${unidad} (${formatearPorcentaje(arco.proporcion)})`}
              </title>
            </circle>
          ))}
        </svg>

        <div
          className="pointer-events-none absolute inset-0 flex flex-col items-center justify-center px-8 text-center"
          aria-live="polite"
        >
          {seleccionada ? (
            <>
              <span className="line-clamp-2 text-xs text-ganker-muted">
                {seleccionada.nombre}
              </span>
              <span className="font-heading text-xl font-bold text-ganker-text">
                {formatearPorcentaje(seleccionada.proporcion)}
              </span>
              <span className="text-xs text-ganker-muted">
                {seleccionada.valor} {unidad}
              </span>
            </>
          ) : (
            <>
              <span className="font-heading text-2xl font-bold text-ganker-text">
                {total}
              </span>
              <span className="text-xs text-ganker-muted">{unidad}</span>
            </>
          )}
        </div>
      </div>
    </figure>
  );
};

export default GraficoTortaComponent;
