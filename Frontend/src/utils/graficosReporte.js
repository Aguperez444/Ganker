// Datos de las tortas del panel "Ultimo reporte" (Admin > Reportes).

// Paleta categorica para fondo oscuro, en orden fijo (no se cicla). Validada
// contra ganker-surface (#100d2b): banda de luminosidad, croma, separacion
// para daltonismo (peor par adyacente 8.4) y contraste >= 3:1.
export const COLORES_CATEGORIAS = [
  "#3987e5",
  "#d95926",
  "#199e70",
  "#c98500",
  "#d55181",
];

// "Otros" es neutro: no compite con las categorias con nombre.
export const COLOR_OTROS = "#8a84a3";
export const NOMBRE_OTROS = "Otros";

// Como mucho 5 porciones con nombre: el resto se agrupa en "Otros".
const MAXIMO_CATEGORIAS = COLORES_CATEGORIAS.length;

// Proporcion de cada categoria sobre la suma de cantidades. En perfiles y
// equipos es igual al porcentaje del backend; en rangos y personajes no (un
// perfil puede contar en varias filas y esos porcentajes suman mas de 100),
// y una torta solo tiene sentido si las porciones suman el todo.
function conProporcion(segmentos) {
  const suma = segmentos.reduce((acc, s) => acc + s.valor, 0);
  return segmentos.map((s) => ({
    ...s,
    proporcion: suma > 0 ? s.valor / suma : 0,
  }));
}

// El color sigue a la categoria, no a su puesto: se fija con el ultimo
// reporte y el anterior usa el mismo, asi una categoria se ve igual en las
// dos tortas. Lo que no esta entre las principales del ultimo va a "Otros".
export function armarComparacion(ultimoItems, anteriorItems = null) {
  const ordenados = [...ultimoItems].sort((a, b) => b.count - a.count);
  const principales = ordenados.slice(0, MAXIMO_CATEGORIAS);
  const colorDe = new Map(
    principales.map((item, i) => [item.name, COLORES_CATEGORIAS[i]])
  );

  const segmentosDe = (items) => {
    const segmentos = [];
    let otros = 0;
    for (const item of items) {
      if (colorDe.has(item.name)) {
        segmentos.push({
          clave: item.name,
          nombre: item.name,
          valor: item.count,
          color: colorDe.get(item.name),
        });
      } else {
        otros += item.count;
      }
    }
    // Mismo orden en las dos tortas: el del ultimo reporte.
    segmentos.sort(
      (a, b) =>
        principales.findIndex((p) => p.name === a.clave) -
        principales.findIndex((p) => p.name === b.clave)
    );
    if (otros > 0) {
      segmentos.push({
        clave: NOMBRE_OTROS,
        nombre: NOMBRE_OTROS,
        valor: otros,
        color: COLOR_OTROS,
      });
    }
    return conProporcion(segmentos.filter((s) => s.valor > 0));
  };

  // Leyenda: las principales con su variacion contra el reporte anterior
  // (la calcula el backend) y, si hay, "Otros" agrupado.
  const restantes = ordenados.slice(MAXIMO_CATEGORIAS);
  const leyenda = principales.map((item) => ({
    clave: item.name,
    nombre: item.name,
    color: colorDe.get(item.name),
    valor: item.count,
    variation: item.variation,
    variation_percentage: item.variation_percentage,
    trend: item.trend,
  }));
  if (restantes.length > 0) {
    const tieneVariacion = restantes.some((i) => i.variation !== null);
    leyenda.push({
      clave: NOMBRE_OTROS,
      nombre: `${NOMBRE_OTROS} (${restantes.length})`,
      color: COLOR_OTROS,
      valor: restantes.reduce((acc, i) => acc + i.count, 0),
      variation: tieneVariacion
        ? restantes.reduce((acc, i) => acc + (i.variation ?? 0), 0)
        : null,
      variation_percentage: null,
      trend: null,
    });
  }

  return {
    ultimo: segmentosDe(ultimoItems),
    anterior: anteriorItems ? segmentosDe(anteriorItems) : null,
    leyenda,
  };
}
