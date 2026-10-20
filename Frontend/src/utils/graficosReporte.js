// Datos de las tortas del panel "Ultimo reporte" (Admin > Reportes).

// Paleta de la marca, en orden fijo (no se cicla): naranja, violeta, crema y
// purpura para las categorias, de la mas visible a la menos, asi la porcion
// mas grande es la que mas resalta.
// Validada contra ganker-surface (#100d2b): se distinguen bien entre si
// incluso con daltonismo (todos los pares), pero el purpura (1.43:1) y el
// navy de "Otros" (1.03:1) casi no contrastan con el fondo. Por eso cada
// porcion lleva el contorno crema (COLOR_CONTORNO) y la leyenda va con
// nombre y valor: sin eso esas porciones no se verian.
export const COLORES_CATEGORIAS = ["#FF9900", "#6B4BCB", "#F4E9DD", "#352070"];

// "Otros" en navy: el menos visible, para que no compita con las categorias
// con nombre (el contorno crema lo delimita).
export const COLOR_OTROS = "#14122A";
export const NOMBRE_OTROS = "Otros";

// Contorno de cada porcion (y de las muestras de la leyenda).
export const COLOR_CONTORNO = "#F4E9DD";

// Como mucho 4 porciones con nombre (una por color): el resto, a "Otros".
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
