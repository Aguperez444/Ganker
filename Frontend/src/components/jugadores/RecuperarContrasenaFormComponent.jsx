import { Link } from "react-router-dom";
import CampoTexto from "../common/CampoTexto";
import { formatearEspera } from "../../utils/tiempo";

const ICONO_MAIL = (
  <svg
    className="h-4 w-4"
    fill="none"
    stroke="currentColor"
    strokeWidth="2"
    viewBox="0 0 24 24"
  >
    <path
      strokeLinecap="round"
      strokeLinejoin="round"
      d="M3 8l7.89 5.26a2 2 0 002.22 0L21 8M5 19h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v10a2 2 0 002 2z"
    />
  </svg>
);

// US 34 - Cambiar contraseña, paso 1. Mismo estilo que FormLogin.
// `enviado`: mensaje generico del backend; no dice si el mail existe.
function RecuperarContrasenaFormComponent({
  valores,
  errores,
  cargando,
  errorServidor,
  enviado,
  segundosParaReenviar = 0,
  onChange,
  onSubmit,
}) {
  return (
    <form
      onSubmit={onSubmit}
      noValidate
      className="space-y-5 rounded-2xl border border-ganker-bg bg-ganker-surface p-8 shadow-[0_0px_10px] shadow-ganker-purple"
    >
      <div>
        <h1 className="font-heading text-xl font-bold text-ganker-text">
          Recuperar contraseña
        </h1>
        <p className="mt-1 text-sm text-ganker-muted font-body">
          Ingresá el email de tu cuenta y te enviaremos un enlace para elegir
          una nueva contraseña. El enlace vence a los 15 minutos.
        </p>
      </div>

      <CampoTexto
        label="EMAIL"
        icono={ICONO_MAIL}
        type="email"
        placeholder="tuemail@ejemplo.com"
        value={valores.email}
        onChange={(e) => onChange("email", e.target.value)}
        error={errores.email}
      />

      {enviado && (
        <p className="rounded-lg border border-ganker-success/40 bg-ganker-success/10 px-3 py-2 text-sm text-ganker-success font-body">
          ✓ {enviado}
        </p>
      )}

      {errorServidor && (
        <p className="rounded-lg border border-ganker-error/40 bg-ganker-error/10 px-3 py-2 text-sm text-ganker-error font-body">
          {errorServidor}
        </p>
      )}

      <button
        type="submit"
        disabled={cargando || segundosParaReenviar > 0}
        className="w-full rounded-lg bg-gradient-to-r from-ganker-orange to-ganker-purple py-3
          text-sm font-bold uppercase tracking-wide text-ganker-text font-heading transition
          hover:brightness-110 disabled:cursor-not-allowed disabled:opacity-60"
      >
        {cargando
          ? "Enviando..."
          : segundosParaReenviar > 0
            ? `Reenviar en ${formatearEspera(segundosParaReenviar)}`
            : "Enviar enlace"}
      </button>

      <p className="text-center text-sm font-body">
        <Link to="/login" className="text-ganker-purple-light hover:underline">
          Volver a iniciar sesión
        </Link>
      </p>
    </form>
  );
}

export default RecuperarContrasenaFormComponent;
