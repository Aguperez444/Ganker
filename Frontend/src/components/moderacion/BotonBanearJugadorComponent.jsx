import { useState } from "react";
import ModalBanearJugadorComponent from "./ModalBanearJugadorComponent";

// US 36 - Acceso al baneo desde la fila de un usuario ya elegido
// (Admin > Usuarios o el perfil del jugador). No se muestra si el objetivo es
// uno mismo: el backend tambien lo rechaza, pero la opción directamente no
// debe estar disponible.
//
// No se consulta si la cuenta ya está baneada: un jugador baneado no aparece
// en las búsquedas ni en su perfil, y si igual se intenta, el backend lo
// rechaza y el modal muestra su mensaje.
//
// El modal se monta recién al hacer click, así cada apertura parte de un
// estado limpio.
//
// `onBaneado(mensaje)` (opcional): se llama al cerrar el modal si el baneo se
// aplicó, para que la pantalla muestre el aviso y saque al jugador de la vista.
// Se espera al cierre para no desmontar el modal antes del paso de éxito.
const BotonBanearJugadorComponent = ({
  jugador,
  miId,
  disabled = false,
  onBaneado,
}) => {
  const [abierto, setAbierto] = useState(false);
  const [mensajeBaneo, setMensajeBaneo] = useState("");

  if (!jugador?.user_id || jugador.user_id === miId) return null;

  const handleCerrar = () => {
    setAbierto(false);
    if (mensajeBaneo) onBaneado?.(mensajeBaneo);
  };

  return (
    <>
      <button
        type="button"
        onClick={() => setAbierto(true)}
        disabled={disabled}
        title="Banear jugador"
        className="shrink-0 cursor-pointer rounded-lg border border-ganker-error/40 px-3 py-1.5 text-sm font-semibold text-ganker-error transition hover:bg-ganker-error/10 disabled:cursor-not-allowed disabled:opacity-50"
      >
        Banear jugador
      </button>

      {abierto && (
        <ModalBanearJugadorComponent
          jugador={jugador}
          onClose={handleCerrar}
          onBaneado={setMensajeBaneo}
        />
      )}
    </>
  );
};

export default BotonBanearJugadorComponent;
