import { useState } from "react";
import ModalBanearJugadorComponent from "./ModalBanearJugadorComponent";

// US 36 - Acceso al baneo desde la fila de un usuario ya elegido
// (Admin > Usuarios). No se muestra si el objetivo es uno mismo: el backend
// tambien lo rechaza, pero la opción directamente no debe estar disponible.
//
// El modal se monta recién al hacer click, así cada apertura parte de un
// estado limpio.
//
// `onBaneado`: se llama al cerrar el modal, para que la pantalla que lo usa
// pueda recargar el listado de baneos y reflejar el nuevo estado.
const BotonBanearJugadorComponent = ({
  jugador,
  miId,
  yaBaneado = false,
  disabled = false,
  onBaneado,
}) => {
  const [abierto, setAbierto] = useState(false);

  if (!jugador?.user_id || jugador.user_id === miId) return null;

  const handleCerrar = () => {
    setAbierto(false);
    onBaneado?.();
  };

  return (
    <>
      <button
        type="button"
        onClick={() => setAbierto(true)}
        disabled={disabled || yaBaneado}
        title={yaBaneado ? "Esta cuenta ya está baneada" : "Banear jugador"}
        className="shrink-0 cursor-pointer rounded-lg border border-ganker-error/40 px-3 py-1.5 text-sm font-semibold text-ganker-error transition hover:bg-ganker-error/10 disabled:cursor-not-allowed disabled:opacity-50"
      >
        {yaBaneado ? "Ya baneado" : "Banear jugador"}
      </button>

      {abierto && (
        <ModalBanearJugadorComponent jugador={jugador} onClose={handleCerrar} />
      )}
    </>
  );
};

export default BotonBanearJugadorComponent;
