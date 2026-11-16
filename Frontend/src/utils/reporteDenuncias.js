export function fechaDeCalendario(fecha) {
  return `${fecha.getFullYear()}-${String(fecha.getMonth() + 1).padStart(2, "0")}-${String(fecha.getDate()).padStart(2, "0")}`;
}

export function periodoReciente(dias, hoy = new Date()) {
  if (!dias) return { desde: "", hasta: "", limite: "10" };
  const inicio = new Date(hoy);
  inicio.setDate(inicio.getDate() - dias + 1);
  return {
    desde: fechaDeCalendario(inicio),
    hasta: fechaDeCalendario(hoy),
    limite: "10",
  };
}

// Los días del calendario se interpretan en la zona horaria del administrador.
// El extremo final es exclusivo: incluye todo el último día seleccionado.
export function parametrosReporteDenuncias({ desde, hasta, limite }) {
  const params = { ranking_limit: Number(limite) };
  if (desde) params.start_date = new Date(`${desde}T00:00:00`).toISOString();
  if (hasta) {
    const fin = new Date(`${hasta}T00:00:00`);
    fin.setDate(fin.getDate() + 1);
    params.end_date = fin.toISOString();
  }
  return params;
}
