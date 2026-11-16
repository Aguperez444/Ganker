import { useCallback, useEffect, useRef, useState } from "react";
import ModalBanearJugadorComponent from "./ModalBanearJugadorComponent";
import ModalDetalleDenunciaComponent from "./ModalDetalleDenunciaComponent";
import ModalReportesJugadorComponent from "./ModalReportesJugadorComponent";
import ModalDesestimarDenunciaComponent from "./ModalDesestimarDenunciaComponent";

// Una sola ventana visible. La pila conserva el reporte y la página de origen.
export default function ModalRevisionDenunciaComponent({
  denuncia,
  jugador: jugadorInicial,
  miId,
  onClose,
  onBaneado,
  onDesestimada,
  soloLectura = false,
}) {
  const [vistas, setVistas] = useState(() => [
    jugadorInicial
      ? { tipo: "reportes", jugador: jugadorInicial, pagina: 0 }
      : { tipo: "detalle", denuncia },
  ]);
  const [mensajeBaneo, setMensajeBaneo] = useState("");
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

  const abrirDetalle = (reporte) =>
    setVistas((previas) => [
      ...previas,
      { tipo: "detalle", denuncia: reporte },
    ]);
  const jugador = actual.jugador ?? {
    user_id: actual.denuncia.reported_user_id,
    username: actual.denuncia.reported_user_name,
  };

  if (actual.tipo === "reportes") {
    return (
      <ModalReportesJugadorComponent
        cerrarLabel={
          vistas.length === 1
            ? "Cerrar denuncias del jugador"
            : "Volver al reporte"
        }
        jugador={jugador}
        pagina={actual.pagina}
        onPaginaChange={(pagina) =>
          setVistas((previas) => [
            ...previas.slice(0, -1),
            { ...previas[previas.length - 1], pagina },
          ])
        }
        onVerDetalle={abrirDetalle}
        onClose={volver}
      />
    );
  }

  if (actual.tipo === "baneo") {
    return (
      <ModalBanearJugadorComponent
        jugador={jugador}
        denunciaId={actual.denuncia.id}
        onBaneado={setMensajeBaneo}
        onClose={() => {
          if (mensajeBaneo) {
            onClose();
            onBaneado?.(mensajeBaneo);
          } else volver();
        }}
      />
    );
  }

  if (actual.tipo === "desestimar") {
    return (
      <ModalDesestimarDenunciaComponent
        denuncia={actual.denuncia}
        onClose={volver}
        onDesestimada={() => {
          onClose();
          onDesestimada?.("Denuncia desestimada. No se aplicó ningún baneo.");
        }}
      />
    );
  }

  return (
    <ModalDetalleDenunciaComponent
      denuncia={actual.denuncia}
      onClose={volver}
      volverAlHistorial={vistas.length > 1}
      volverAlReporte={vistas[vistas.length - 2]?.tipo === "detalle"}
      onVerDenunciaCruzada={abrirDetalle}
      puedeBanear={
        jugador.user_id !== miId && actual.denuncia.status === "pending"
      }
      onVerReportes={() =>
        setVistas((previas) => [
          ...previas,
          { tipo: "reportes", jugador, pagina: 0 },
        ])
      }
      onBanear={() =>
        !soloLectura &&
        actual.denuncia.status === "pending" &&
        setVistas((previas) => [
          ...previas,
          { tipo: "baneo", jugador, denuncia: actual.denuncia },
        ])
      }
      mostrarBaneo={!soloLectura}
      onDesestimar={
        !soloLectura && actual.denuncia.status === "pending"
          ? () =>
              setVistas((previas) => [
                ...previas,
                { tipo: "desestimar", denuncia: actual.denuncia },
              ])
          : undefined
      }
    />
  );
}
