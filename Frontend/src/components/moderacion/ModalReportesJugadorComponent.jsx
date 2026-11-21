import ModalModeracionComponent from "./ModalModeracionComponent";
import ReportesJugadorComponent from "./ReportesJugadorComponent";

export default function ModalReportesJugadorComponent({
  onClose,
  cerrarLabel = "Volver al reporte",
  ...props
}) {
  return (
    <ModalModeracionComponent
      titulo={`Reportes de @${props.jugador.username}`}
      subtitulo="Historial del jugador"
      cerrarLabel={cerrarLabel}
      onClose={onClose}
    >
      <ReportesJugadorComponent {...props} />
    </ModalModeracionComponent>
  );
}
