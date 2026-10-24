import { useState } from "react";
import ModalReportarJugadorComponent from "./ModalReportarJugadorComponent";

const CLASES_VARIANTE = {
  perfil:
    "inline-flex items-center gap-2 rounded-xl border border-ganker-error/40 px-5 py-3 text-sm font-semibold text-ganker-error transition hover:bg-ganker-error/10",
  equipo:
    "inline-flex items-center gap-2 rounded-lg border border-ganker-error/40 px-3 py-1.5 text-sm font-semibold text-ganker-error transition hover:bg-ganker-error/10",
  icono:
    "flex h-8 w-8 items-center justify-center rounded-lg text-ganker-muted transition hover:bg-ganker-error/10 hover:text-ganker-error",
};

// Icono de bandera para reportar. Se usa como disparador en el perfil, en el
// encabezado del chat privado y en cada integrante de un equipo.
function IconoReporte() {
  return (
    <svg
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth="1.8"
      strokeLinecap="round"
      strokeLinejoin="round"
      className="h-4 w-4 shrink-0"
      aria-hidden="true"
    >
      <path d="M5 21V4" />
      <path d="M5 4h10l-2 3 2 3H5" />
    </svg>
  );
}

// US 35 - Acceso al reporte de un jugador.
//
// No se muestra si el jugador objetivo es uno mismo: la validacion tambien
// existe en el backend y en el modal, pero ocultar la opcion cumple el
// criterio "la opción no se encuentra disponible".
//
// El modal se monta recien al hacer click, asi cada apertura parte de un
// estado limpio.
const BotonReportarJugadorComponent = ({
  jugador,
  currentUserId,
  variante = "equipo",
  soloIcono = false,
  claseExtra = "",
}) => {
  const [abierto, setAbierto] = useState(false);

  if (!jugador?.user_id || jugador.user_id === currentUserId) return null;

  const nombreJugador = jugador.username || jugador.name || "jugador";
  const clasesVariante = CLASES_VARIANTE[variante] ?? CLASES_VARIANTE.equipo;

  return (
    <>
      <button
        type="button"
        onClick={() => setAbierto(true)}
        aria-label={`Reportar a ${nombreJugador}`}
        title="Reportar jugador"
        className={`shrink-0 cursor-pointer ${clasesVariante} ${claseExtra}`}
      >
        <IconoReporte />
        {!soloIcono && <span>Reportar</span>}
      </button>

      {abierto && (
        <ModalReportarJugadorComponent
          jugador={jugador}
          currentUserId={currentUserId}
          onClose={() => setAbierto(false)}
        />
      )}
    </>
  );
};

export default BotonReportarJugadorComponent;
