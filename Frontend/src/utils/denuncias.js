export function etiquetaEstadoDenuncia(estado) {
  return (
    { resolved: "Resuelto", pending: "Pendiente", rejected: "Desestimado" }[
      estado
    ] ||
    estado ||
    "-"
  );
}
