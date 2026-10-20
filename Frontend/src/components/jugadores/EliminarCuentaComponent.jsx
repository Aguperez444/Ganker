import { useId } from "react";
import ModalConfirmacionComponent from "../common/ModalConfirmacionComponent";

// US 04 - Eliminar jugador. Seccion "Eliminar cuenta" de Mi cuenta: abre un
// modal que explica el impacto y pide escribir el nombre de usuario. El
// estado y la baja vienen de useEliminarCuenta, que arma CuentaPage.
const EliminarCuentaComponent = ({
  username,
  abierto,
  confirmacion,
  puedeConfirmar,
  cargando,
  error,
  onConfirmacionChange,
  onAbrir,
  onCancelar,
  onConfirmar,
}) => {
  const idConfirmacion = useId();

  return (
    <section className="rounded-2xl border border-ganker-error/30 bg-ganker-surface p-6">
      <h2 className="font-heading text-lg font-semibold text-ganker-text">
        Eliminar cuenta
      </h2>
      <p className="mt-1 text-sm text-ganker-muted">
        Da de baja tu cuenta de Ganker junto con todos tus perfiles de juego.
      </p>

      <button
        type="button"
        onClick={onAbrir}
        className="mt-4 cursor-pointer rounded-lg border border-ganker-error/40 px-4 py-2.5 text-sm font-semibold text-ganker-error transition hover:bg-ganker-error/10"
      >
        Eliminar mi cuenta
      </button>

      <ModalConfirmacionComponent
        isOpen={abierto}
        title="Eliminar cuenta"
        message={
          <>
            <p>
              Se van a eliminar tu cuenta y todos tus perfiles de juego, con sus
              roles y rangos. Vas a dejar de aparecer en las búsquedas, se va a
              cerrar tu sesión y no vas a poder volver a ingresar con esta
              cuenta. Esta acción no se puede deshacer.
            </p>
            <label
              htmlFor={idConfirmacion}
              className="mt-4 block text-xs font-semibold text-ganker-text"
            >
              Para confirmar, escribí tu nombre de usuario:{" "}
              <span className="font-bold">{username}</span>
            </label>
            <input
              id={idConfirmacion}
              type="text"
              autoComplete="off"
              value={confirmacion}
              onChange={(e) => onConfirmacionChange(e.target.value)}
              disabled={cargando}
              className="mt-1 w-full rounded-lg border border-white/10 bg-ganker-surface-light px-3 py-2.5 text-sm text-ganker-text focus:border-ganker-error focus:ring-2 focus:ring-ganker-error focus:outline-none disabled:opacity-60"
            />
          </>
        }
        confirmLabel="Eliminar mi cuenta"
        isLoading={cargando}
        confirmDisabled={!puedeConfirmar}
        error={error}
        onConfirm={onConfirmar}
        onCancel={onCancelar}
      />
    </section>
  );
};

export default EliminarCuentaComponent;
