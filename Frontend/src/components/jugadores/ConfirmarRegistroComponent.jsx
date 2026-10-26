import { Link } from "react-router-dom";

const CLASES_BOTON =
  "block w-full rounded-lg bg-gradient-to-r from-ganker-orange to-ganker-purple py-3 text-center text-sm font-bold uppercase tracking-wide text-ganker-text font-heading transition hover:brightness-110 disabled:cursor-not-allowed disabled:opacity-60";

function ConfirmarRegistroComponent({
  token,
  mensaje,
  cargando,
  errorServidor,
  exito,
  onConfirmar,
  children,
}) {
  return (
    <div className="space-y-5 rounded-2xl border border-ganker-bg bg-ganker-surface p-8 shadow-[0_0px_10px] shadow-ganker-purple">
      <h1 className="font-heading text-xl font-bold text-ganker-text">
        {exito
          ? "Cuenta confirmada"
          : mensaje
            ? "Revisá tu correo"
            : "Confirmá tu cuenta"}
      </h1>
      {exito ? (
        <>
          <p
            role="status"
            className="rounded-lg border border-ganker-success/40 bg-ganker-success/10 px-3 py-2 text-sm text-ganker-success font-body"
          >
            {exito}
          </p>
          <Link to="/login" className={CLASES_BOTON}>
            Iniciar sesión
          </Link>
        </>
      ) : (
        <>
          <p className="text-sm text-ganker-muted font-body">
            {mensaje ??
              (token
                ? "Confirmá la creación de tu cuenta para empezar a usar Ganker. Si no solicitaste este registro, podés cerrar esta página."
                : "Falta el enlace de confirmación. Ingresá el email que usaste para registrarte y te enviaremos uno nuevo.")}
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
              {cargando ? "Confirmando..." : "Confirmar mi cuenta"}
            </button>
          )}
          {(!token || errorServidor) && children}
          <p className="text-center text-sm font-body">
            <Link
              to="/registro"
              className="text-ganker-purple-light hover:underline"
            >
              Volver al registro
            </Link>
          </p>
          <p className="text-center text-sm font-body">
            <Link
              to="/login"
              className="text-ganker-purple-light hover:underline"
            >
              Ya confirmé mi cuenta: iniciar sesión
            </Link>
          </p>
        </>
      )}
    </div>
  );
}

export default ConfirmarRegistroComponent;
