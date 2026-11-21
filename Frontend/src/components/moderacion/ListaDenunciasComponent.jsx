import { useCallback, useState } from "react";
import TablaDenunciasComponent from "./TablaDenunciasComponent";
import ModalRevisionDenunciaComponent from "./ModalRevisionDenunciaComponent";

export default function ListaDenunciasComponent({
  miId,
  onBaneado,
  onDesestimada,
  ...props
}) {
  const [seleccionada, setSeleccionada] = useState(null);
  const cerrarRevision = useCallback(() => setSeleccionada(null), []);

  return (
    <>
      <TablaDenunciasComponent {...props} onVerDetalle={setSeleccionada} />
      {seleccionada && (
        <ModalRevisionDenunciaComponent
          denuncia={seleccionada}
          miId={miId}
          onClose={cerrarRevision}
          onBaneado={onBaneado}
          onDesestimada={onDesestimada}
        />
      )}
    </>
  );
}
