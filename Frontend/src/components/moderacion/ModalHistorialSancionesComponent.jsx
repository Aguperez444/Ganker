import { useCallback, useEffect, useRef, useState } from "react";
import ModalDetalleBaneoComponent from "./ModalDetalleBaneoComponent";
import ModalDetalleApelacionComponent from "./ModalDetalleApelacionComponent";
import ModalModeracionComponent from "./ModalModeracionComponent";
import BaneosJugadorComponent from "./BaneosJugadorComponent";

export default function ModalHistorialSancionesComponent({
  baneoId,
  apelacionId,
  jugador,
  miId,
  onClose,
  onResuelta,
}) {
  const [vistas, setVistas] = useState([
    baneoId
      ? { tipo: "baneo", id: baneoId }
      : apelacionId
        ? { tipo: "apelacion", id: apelacionId }
        : { tipo: "historial", jugador, pagina: 0 },
  ]);
  const focoInicial = useRef(document.activeElement);
  const actual = vistas[vistas.length - 1];
  useEffect(() => {
    const foco = focoInicial.current;
    return () => foco?.focus();
  }, []);
  const volver = useCallback(() => {
    if (vistas.length === 1) onClose();
    else setVistas((previas) => previas.slice(0, -1));
  }, [vistas.length, onClose]);
  const abrir = (tipo, id) =>
    setVistas((previas) => [...previas, { tipo, id }]);

  if (actual.tipo === "historial")
    return (
      <ModalModeracionComponent
        titulo={`Baneos de @${actual.jugador.username}`}
        subtitulo="Historial completo del jugador"
        cerrarLabel="Cerrar baneos del jugador"
        onClose={volver}
      >
        <div className="p-5 sm:p-6">
          <p className="mb-4 text-sm text-ganker-muted">
            Todos sus baneos, del más reciente al más antiguo. Abrí un detalle
            para revisar la sanción, su finalización y la apelación, si existe.
          </p>
          <BaneosJugadorComponent
            jugadorId={actual.jugador.user_id}
            pagina={actual.pagina}
            onPaginaChange={(pagina) =>
              setVistas((previas) => [
                ...previas.slice(0, -1),
                { ...previas[previas.length - 1], pagina },
              ])
            }
            onVerDetalle={(baneo) => abrir("baneo", baneo.id)}
          />
        </div>
      </ModalModeracionComponent>
    );

  if (actual.tipo === "baneo")
    return (
      <ModalDetalleBaneoComponent
        key={`baneo-${actual.id}`}
        id={actual.id}
        miId={miId}
        volverAlHistorial={vistas.length > 1}
        onClose={volver}
        onVerApelacion={(id) => abrir("apelacion", id)}
      />
    );
  return (
    <ModalDetalleApelacionComponent
      key={`apelacion-${actual.id}`}
      id={actual.id}
      miId={miId}
      volverAlHistorial={vistas.length > 1}
      onClose={volver}
      onResuelta={onResuelta}
      onVerBaneo={(baneo) => abrir("baneo", baneo.id)}
    />
  );
}
