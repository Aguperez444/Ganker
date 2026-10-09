// Un par etiqueta/valor de la ficha del equipo. Va dentro de un <dl>.
function DatoEquipoComponent({ etiqueta, valor }) {
  return (
    <div className="rounded-lg border border-white/10 bg-ganker-surface-light px-4 py-3">
      <dt className="text-xs text-ganker-muted">{etiqueta}</dt>
      <dd className="mt-1 text-sm font-medium text-ganker-text">{valor}</dd>
    </div>
  );
}

export default DatoEquipoComponent;
