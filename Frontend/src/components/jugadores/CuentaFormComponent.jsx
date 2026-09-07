import CampoTexto from "../common/CampoTexto";

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

// Formulario de datos de la cuenta (US 02).
// No incluye contrasena a proposito: cambiarla es la US 34.
function CuentaFormComponent({
  valores,
  errores,
  cargando,
  errorServidor,
  exito,
  onChange,
  onBlur,
  onSubmit,
}) {
  return (
    <form
      onSubmit={onSubmit}
      className="space-y-5 rounded-2xl border border-white/10 bg-ganker-surface p-6 sm:p-8"
    >
      <div>
        <h2 className="font-heading text-lg font-semibold text-ganker-text">
          Datos personales
        </h2>
        <p className="mt-1 text-sm text-ganker-muted">
          Estos son los datos con los que te identifican otros jugadores.
        </p>
      </div>

      <div className="grid gap-5 sm:grid-cols-2">
        <CampoTexto
          label="NOMBRE DE USUARIO"
          icono={ICONO_USUARIO}
          placeholder="Tu nombre de usuario"
          value={valores.username}
          onChange={(e) => onChange("username", e.target.value)}
          onBlur={() => onBlur("username")}
          error={errores.username}
        />
        <CampoTexto
          label="EMAIL"
          icono={ICONO_MAIL}
          type="email"
          placeholder="tuemail@ejemplo.com"
          value={valores.mail}
          onChange={(e) => onChange("mail", e.target.value)}
          onBlur={() => onBlur("mail")}
          error={errores.mail}
        />
      </div>

      <CampoTexto
        label="NOMBRE COMPLETO"
        icono={ICONO_USUARIO}
        placeholder="Tu nombre completo"
        value={valores.nombre}
        onChange={(e) => onChange("nombre", e.target.value)}
        onBlur={() => onBlur("nombre")}
        error={errores.nombre}
      />

      <p className="text-xs text-ganker-muted">
        ¿Querés cambiar tu contraseña? Se hace desde una pantalla aparte, por
        seguridad.
      </p>

      {errorServidor && (
        <p
          role="alert"
          className="rounded-lg border border-ganker-error/40 bg-ganker-error/10 px-3 py-2 font-body text-sm text-ganker-error"
        >
          {errorServidor}
        </p>
      )}

      {exito && (
        <p
          role="status"
          className="rounded-lg border border-ganker-success/40 bg-ganker-success/10 px-3 py-2 font-body text-sm text-ganker-success"
        >
          {exito}
        </p>
      )}

      <button
        type="submit"
        disabled={cargando}
        className="w-full rounded-lg bg-gradient-to-r from-ganker-orange to-ganker-purple py-3 font-heading text-sm font-bold tracking-wide text-ganker-text uppercase transition hover:brightness-110 disabled:cursor-not-allowed disabled:opacity-60 sm:w-auto sm:px-8"
      >
        {cargando ? "Guardando..." : "Guardar cambios"}
      </button>
    </form>
  );
}

export default CuentaFormComponent;
