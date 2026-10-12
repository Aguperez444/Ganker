import IconoChicoComponent from "../common/IconoChicoComponent";

function Rango({ rango }) {
  return (
    <span className="inline-flex items-center gap-1">
      <IconoChicoComponent src={rango?.icon_url} className="h-4 w-4" />
      {rango?.name}
    </span>
  );
}

// Rango minimo y maximo del equipo con sus iconos ("Bronce a Diamante"). Si
// son el mismo rango, se muestra una sola vez.
function RangoPermitidoComponent({ rangoMinimo, rangoMaximo }) {
  if (!rangoMinimo || !rangoMaximo) return null;

  if (rangoMinimo.rank_id === rangoMaximo.rank_id) {
    return <Rango rango={rangoMinimo} />;
  }

  return (
    <span className="inline-flex flex-wrap items-center gap-1">
      <Rango rango={rangoMinimo} />
      <span>a</span>
      <Rango rango={rangoMaximo} />
    </span>
  );
}

export default RangoPermitidoComponent;
