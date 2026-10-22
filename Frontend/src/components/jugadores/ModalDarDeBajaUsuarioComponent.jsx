import ModalConfirmacionComponent from "../common/ModalConfirmacionComponent";

// US 50 - Confirmacion de la baja de una cuenta por un admin. Se usa desde
// Admin > Usuarios y desde el perfil de un jugador.
const ModalDarDeBajaUsuarioComponent = ({
  usuario,
  cargando,
  error,
  bloqueado = false,
  onConfirm,
  onCancel,
}) => (
  <ModalConfirmacionComponent
    isOpen={Boolean(usuario)}
    title="Dar de baja cuenta"
    message={
      <>
        <p>
          ¿Seguro que querés dar de baja la cuenta de{" "}
          <span className="font-semibold text-ganker-text">
            @{usuario?.username}
          </span>
          ?
        </p>
        <p className="mt-2">
          Se van a eliminar la cuenta y todos sus perfiles de juego, con sus
          roles y rangos. Se cierran sus sesiones activas, deja de aparecer en
          las búsquedas y no va a poder volver a iniciar sesión. Esta acción no
          se puede deshacer.
        </p>
      </>
    }
    confirmLabel="Dar de baja"
    isLoading={cargando}
    confirmDisabled={bloqueado}
    error={error}
    onConfirm={onConfirm}
    onCancel={onCancel}
  />
);

export default ModalDarDeBajaUsuarioComponent;
