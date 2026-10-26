import { Link } from "react-router-dom";

function ConfirmarCambioEmailComponent({
  token,
  cargando,
  errorServidor,
  exito,
  onConfirmar,
}) {
  return (
    <div className="space-y-5 rounded-2xl border border-ganker-bg bg-ganker-surface p-8 shadow-[0_0px_10px] shadow-ganker-purple">
      <h1 className="font-heading text-xl font-bold text-ganker-text">
        {exito ? "Email confirmado" : "Confirmá tu nuevo email"}
      </h1>
      {exito ? (
        <p role="status" className="text-sm text-ganker-success">
          {exito}
        </p>
      ) : (
        <>
          <p className="text-sm text-ganker-muted">
            {token
              ? "Confirmá que este correo te pertenece para aplicar el cambio de email. Si no lo solicitaste, cerrá esta página."
              : "Falta el enlace de confirmación. Solicitá uno nuevo desde Mi cuenta."}
          </p>
          {errorServidor && (
            <p role="alert" className="text-sm text-ganker-error">
              {errorServidor}
            </p>
          )}
          {token && (
            <button
              type="button"
              disabled={cargando}
              onClick={onConfirmar}
              className="w-full rounded-lg bg-gradient-to-r from-ganker-orange to-ganker-purple py-3 text-sm font-bold text-ganker-text disabled:cursor-not-allowed disabled:opacity-60"
            >
              {cargando ? "Confirmando..." : "Confirmar nuevo email"}
            </button>
          )}
        </>
      )}
      <Link
        to="/app/cuenta"
        className="block text-sm text-ganker-purple-light hover:underline"
      >
        Ir a Mi cuenta
      </Link>
      <Link
        to="/login"
        className="block text-sm text-ganker-purple-light hover:underline"
      >
        Iniciar sesión
      </Link>
    </div>
  );
}

export default ConfirmarCambioEmailComponent;
