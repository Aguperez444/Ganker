import { Link } from "react-router-dom";

const CLASES_BOTON =
  "block w-full rounded-lg bg-gradient-to-r from-ganker-orange to-ganker-purple py-3 text-center text-sm font-bold uppercase tracking-wide text-ganker-text font-heading transition hover:brightness-110 disabled:cursor-not-allowed disabled:opacity-60";

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
        <p
          role="status"
          className="rounded-lg border border-ganker-success/40 bg-ganker-success/10 px-3 py-2 text-sm text-ganker-success font-body"
        >
          {exito}
        </p>
      ) : (
        <>
          <p className="text-sm text-ganker-muted font-body">
            {token
              ? "Confirmá que este correo te pertenece para aplicar el cambio de email. Si no lo solicitaste, cerrá esta página."
              : "Falta el enlace de confirmación. Solicitá uno nuevo desde Mi cuenta."}
          </p>
          {errorServidor && (
            <p role="alert" className="text-sm text-ganker-error font-body">
              {errorServidor}
            </p>
          )}
          {token && (
            <button
              type="button"
              disabled={cargando}
              onClick={onConfirmar}
              className={CLASES_BOTON}
            >
              {cargando ? "Confirmando..." : "Confirmar nuevo email"}
            </button>
          )}
        </>
      )}
      <p className="text-center text-sm font-body">
        <Link
          to="/app/cuenta"
          className="text-ganker-purple-light hover:underline"
        >
          Ir a Mi cuenta
        </Link>
      </p>
      <p className="text-center text-sm font-body">
        <Link to="/login" className="text-ganker-purple-light hover:underline">
          Iniciar sesión
        </Link>
      </p>
    </div>
  );
}

export default ConfirmarCambioEmailComponent;
