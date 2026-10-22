import { useState } from "react";
import { COLOR_CONTORNO } from "../../utils/graficosReporte";

const TAMANIO = 168;
const CENTRO = TAMANIO / 2;
const RADIO_EXTERIOR = 72;
const RADIO_INTERIOR = 46;
// La porcion activa (hover o foco) sobresale un poco.
const RESALTE = 6;
const GROSOR_CONTORNO = 1.5;

function formatearPorcentaje(proporcion) {
  return `${Math.round(proporcion * 1000) / 10}%`;
}

function punto(radio, angulo) {
  return [CENTRO + radio * Math.cos(angulo), CENTRO + radio * Math.sin(angulo)];
}

// Sector de anillo entre dos angulos (en radianes, 0 = arriba). Una porcion
// del 100% se dibuja como dos mitades: un arco de 360° no se puede expresar
// con un solo comando A de SVG.
function sector(desde, hasta, exterior) {
  if (hasta - desde >= 2 * Math.PI - 1e-6) {
    const mitad = desde + Math.PI;
    return `${sector(desde, mitad, exterior)} ${sector(mitad, hasta, exterior)}`;
  }
  const a0 = desde - Math.PI / 2;
  const a1 = hasta - Math.PI / 2;
  const grande = hasta - desde > Math.PI ? 1 : 0;
  const [x0, y0] = punto(exterior, a0);
  const [x1, y1] = punto(exterior, a1);
  const [x2, y2] = punto(RADIO_INTERIOR, a1);
  const [x3, y3] = punto(RADIO_INTERIOR, a0);
  return [
    `M ${x0} ${y0}`,
    `A ${exterior} ${exterior} 0 ${grande} 1 ${x1} ${y1}`,
    `L ${x2} ${y2}`,
    `A ${RADIO_INTERIOR} ${RADIO_INTERIOR} 0 ${grande} 0 ${x3} ${y3}`,
    "Z",
  ].join(" ");
}

// Torta (dona) de un reporte. `segmentos`: [{ clave, nombre, valor,
// proporcion, color }], ya agrupados (ver utils/graficosReporte.js). Cada
// porcion lleva contorno crema, que tambien la separa de las vecinas. Al
// pasar el mouse o enfocar una porcion con el teclado, el centro muestra su
// nombre, cantidad y porcentaje; si no, el total.
const GraficoTortaComponent = ({ titulo, subtitulo, segmentos, unidad }) => {
  const [activa, setActiva] = useState(null);
  const total = segmentos.reduce((acc, s) => acc + s.valor, 0);
  const seleccionada = segmentos.find((s) => s.clave === activa);

  // Cada porcion arranca donde terminan las anteriores (suma de angulos).
  const sectores = segmentos.map((segmento, indice) => {
    const desde = segmentos
      .slice(0, indice)
      .reduce((acc, s) => acc + s.proporcion * 2 * Math.PI, 0);
    return {
      ...segmento,
      desde,
      hasta: desde + segmento.proporcion * 2 * Math.PI,
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
        >
          {sectores.map((s) => (
            <path
              key={s.clave}
              d={sector(
                s.desde,
                s.hasta,
                activa === s.clave ? RADIO_EXTERIOR + RESALTE : RADIO_EXTERIOR
              )}
              fill={s.color}
              stroke={COLOR_CONTORNO}
              strokeWidth={GROSOR_CONTORNO}
              strokeLinejoin="round"
              opacity={activa && activa !== s.clave ? 0.55 : 1}
              tabIndex={0}
              aria-label={`${s.nombre}: ${s.valor} ${unidad}, ${formatearPorcentaje(s.proporcion)}`}
              onMouseEnter={() => setActiva(s.clave)}
              onMouseLeave={() => setActiva(null)}
              onFocus={() => setActiva(s.clave)}
              onBlur={() => setActiva(null)}
              className="cursor-pointer transition-opacity duration-150 outline-none"
            >
              <title>
                {`${s.nombre}: ${s.valor} ${unidad} (${formatearPorcentaje(s.proporcion)})`}
              </title>
            </path>
          ))}
        </svg>

        <div
          className="pointer-events-none absolute inset-0 flex flex-col items-center justify-center px-10 text-center"
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
