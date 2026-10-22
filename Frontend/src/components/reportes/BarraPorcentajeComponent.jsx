// Barra horizontal + porcentaje: la representacion grafica de cada fila de
// los reportes. Se recorta a 100% por las dudas (en los reportes de uso un
// perfil puede contar en varias categorias, pero cada una es <= 100%).
const BarraPorcentajeComponent = ({ porcentaje }) => (
  <div className="flex items-center gap-2">
    <div
      className="h-2 w-28 overflow-hidden rounded-full bg-white/10"
      aria-hidden="true"
    >
      <div
        className="h-full rounded-full bg-gradient-to-r from-ganker-orange to-ganker-purple"
        style={{ width: `${Math.min(Math.max(porcentaje, 0), 100)}%` }}
      />
    </div>
    <span>{porcentaje}%</span>
  </div>
);

export default BarraPorcentajeComponent;
