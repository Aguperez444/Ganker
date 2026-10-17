import { Link } from "react-router-dom";
import CampoTexto from "../common/CampoTexto";
import IconoProveedorFederadoComponent from "../common/IconoProveedorFederadoComponent";
import { nombreProveedorFederado } from "../../utils/proveedoresFederados";

const ICONO_USUARIO = (
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
      d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z"
    />
  </svg>
);

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
      d="M3 8l9 6 9-6M5 6h14a2 2 0 012 2v8a2 2 0 01-2 2H5a2 2 0 01-2-2V8a2 2 0 012-2z"
    />
  </svg>
);

// Formulario de "Completá tu registro con X". Equivalente a JugadorForm pero
// sin contraseña: la cuenta se autentica siempre con el proveedor externo.
function RegistroFederadoFormComponent({
  proveedor,
  avatarUrl,
  valores,
  errores,
  cargando,
  errorServidor,
  onChange,
  onBlur,
  onSubmit,
  onCancelar,
}) {
  const nombreProveedor = nombreProveedorFederado(proveedor);

  return (
    <form
      onSubmit={onSubmit}
      className="space-y-5 rounded-2xl border border-ganker-bg bg-ganker-surface p-8 shadow-[0_0px_10px] shadow-ganker-purple"
    >
      <div className="flex items-center gap-4 rounded-xl border border-white/10 bg-ganker-bg/60 p-4">
        {avatarUrl ? (
          <img
            src={avatarUrl}
            alt={`Avatar de ${nombreProveedor}`}
            className="h-12 w-12 shrink-0 rounded-full border border-ganker-purple/50 object-cover"
          />
        ) : (
          <div className="flex h-12 w-12 shrink-0 items-center justify-center rounded-full bg-ganker-purple/30 text-ganker-text">
            <IconoProveedorFederadoComponent proveedor={proveedor} />
          </div>
        )}
        <div className="min-w-0">
          <div className="flex items-center gap-2">
            <IconoProveedorFederadoComponent proveedor={proveedor} />
            <h2 className="font-heading text-base font-bold text-ganker-text">
              Completá tu registro con {nombreProveedor}
            </h2>
          </div>
          <p className="mt-0.5 font-body text-xs text-ganker-muted">
            Elegí tu nombre de usuario y tu nombre visible antes de entrar a
            Ganker.
          </p>
        </div>
      </div>

      <CampoTexto
        label="NOMBRE DE USUARIO"
        icono={ICONO_USUARIO}
        placeholder="Elegí tu nombre de usuario"
        value={valores.username}
        onChange={(e) => onChange("username", e.target.value)}
        onBlur={() => onBlur("username")}
        error={errores.username}
      />

      <CampoTexto
        label="NOMBRE COMPLETO"
        icono={ICONO_USUARIO}
        placeholder="Tu nombre completo"
        value={valores.nombre}
        onChange={(e) => onChange("nombre", e.target.value)}
        onBlur={() => onBlur("nombre")}
        error={errores.nombre}
      />

      <CampoTexto
        label="EMAIL (OPCIONAL)"
        icono={ICONO_MAIL}
        type="email"
        placeholder="tuemail@ejemplo.com"
        value={valores.mail}
        onChange={(e) => onChange("mail", e.target.value)}
        onBlur={() => onBlur("mail")}
        error={errores.mail}
      />

      {errorServidor && (
        <p
          role="alert"
          className="rounded-lg border border-ganker-error/40 bg-ganker-error/10 px-3 py-2 font-body text-sm text-ganker-error"
        >
          {errorServidor}
        </p>
      )}

      <button
        type="submit"
        disabled={cargando}
        className="w-full cursor-pointer rounded-lg bg-gradient-to-r from-ganker-orange to-ganker-purple py-3 font-heading text-sm font-bold tracking-wide text-ganker-text uppercase transition hover:brightness-110 disabled:cursor-not-allowed disabled:opacity-60"
      >
        {cargando ? "Creando cuenta..." : "Finalizar registro y entrar"}
      </button>

      <div className="text-center">
        <Link
          to="/login"
          onClick={onCancelar}
          className="font-body text-xs text-ganker-muted transition hover:text-ganker-text"
        >
          Cancelar y volver al inicio de sesión
        </Link>
      </div>
    </form>
  );
}

export default RegistroFederadoFormComponent;
