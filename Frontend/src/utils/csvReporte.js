// PROVISORIO para la demo: el backend todavia no tiene un endpoint que
// devuelva los datos de un reporte ya generado, asi que se leen del CSV que
// devuelve /export. Cuando exista GET /reports/.../{id}, este archivo se
// borra y reportesApi pasa a usar ese endpoint (la forma de los datos que
// devuelve leerReporteDesdeCsv es la misma que la del POST).
//
// Formato del CSV (ReportExportService._build_csv en el backend):
//   ENCABEZADOS
//   nombre,cantidad,porcentaje,variacion,variacion_porcentaje,tendencia
//   ...
//   (linea vacia)
//   TOTAL,total,...

// CSV estandar: campos separados por coma, con comillas dobles si hace falta
// (y "" para una comilla literal).
export function parsearCsv(texto) {
  const filas = [];
  let fila = [];
  let campo = "";
  let entreComillas = false;

  for (let i = 0; i < texto.length; i += 1) {
    const c = texto[i];

    if (entreComillas) {
      if (c === '"' && texto[i + 1] === '"') {
        campo += '"';
        i += 1;
      } else if (c === '"') {
        entreComillas = false;
      } else {
        campo += c;
      }
    } else if (c === '"') {
      entreComillas = true;
    } else if (c === ",") {
      fila.push(campo);
      campo = "";
    } else if (c === "\n" || c === "\r") {
      if (c === "\r" && texto[i + 1] === "\n") i += 1;
      fila.push(campo);
      filas.push(fila);
      fila = [];
      campo = "";
    } else {
      campo += c;
    }
  }

  if (campo !== "" || fila.length > 0) {
    fila.push(campo);
    filas.push(fila);
  }
  return filas;
}

// El backend antepone ' a los textos que Excel tomaria como formula.
function texto(valor) {
  return valor.startsWith("'") ? valor.slice(1) : valor;
}

function numero(valor) {
  if (valor === undefined || valor.trim() === "") return null;
  const n = Number(valor);
  return Number.isFinite(n) ? n : null;
}

// Devuelve { items: [{ name, count, percentage, variation,
// variation_percentage, trend }], total }.
export function leerReporteDesdeCsv(contenido) {
  // Si viene con BOM (U+FEFF al principio), se lo saca.
  const sinBom =
    contenido.charCodeAt(0) === 0xfeff ? contenido.slice(1) : contenido;
  const filas = parsearCsv(sinBom);
  const items = [];
  let total = null;

  for (const fila of filas.slice(1)) {
    const vacia = fila.every((celda) => celda.trim() === "");
    if (vacia) continue;

    if (fila[0] === "TOTAL") {
      total = numero(fila[1]);
      continue;
    }

    items.push({
      name: texto(fila[0]),
      count: numero(fila[1]) ?? 0,
      percentage: numero(fila[2]),
      variation: numero(fila[3]),
      variation_percentage: numero(fila[4]),
      trend: fila[5]?.trim() || null,
    });
  }

  return { items, total };
}
