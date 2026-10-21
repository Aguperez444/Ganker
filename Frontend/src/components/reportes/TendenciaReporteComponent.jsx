const TENDENCIAS = {
  sube: { simbolo: "▲", texto: "Sube", clases: "text-ganker-success" },
  baja: { simbolo: "▼", texto: "Baja", clases: "text-ganker-error" },
  estable: { simbolo: "■", texto: "Estable", clases: "text-ganker-muted" },
};

// Tendencia respecto al reporte previo ("sube" / "baja" / "estable"), igual
// en todos los reportes.
const TendenciaReporteComponent = ({ trend }) => {
  const tendencia = TENDENCIAS[trend];
  if (!tendencia) return "—";

  return (
    <span className={tendencia.clases}>
      <span aria-hidden="true">{tendencia.simbolo}</span> {tendencia.texto}
    </span>
  );
};

export default TendenciaReporteComponent;
