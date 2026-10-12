import { urlDeMedia } from "../../utils/media";

// Icono chico (rango, rol, avatar en listas). Si no hay imagen o no carga, no
// muestra nada roto: deja el hueco (o el placeholder punteado, si se pide)
// para que las filas no salten.
function IconoChicoComponent({ src, alt = "", className = "", placeholder }) {
  const url = urlDeMedia(src);

  if (!url) {
    return placeholder ? (
      <div
        className={`${className} border border-dashed border-white/20 bg-ganker-surface`}
      />
    ) : null;
  }

  return (
    <img
      src={url}
      alt={alt}
      className={`${className} object-cover`}
      onError={(e) => {
        e.currentTarget.style.visibility = "hidden";
      }}
    />
  );
}

export default IconoChicoComponent;
