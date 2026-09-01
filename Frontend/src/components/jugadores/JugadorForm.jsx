import CampoTexto from "../common/CampoTexto";

const ICONO_USUARIO = (
  <svg className="h-4 w-4" fill="none" stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24">
    <path strokeLinecap="round" strokeLinejoin="round" d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z" />
  </svg>
);

const ICONO_MAIL = (
  <svg className="h-4 w-4" fill="none" stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24">
    <path strokeLinecap="round" strokeLinejoin="round" d="M3 8l9 6 9-6M5 6h14a2 2 0 012 2v8a2 2 0 01-2 2H5a2 2 0 01-2-2V8a2 2 0 012-2z" />
  </svg>
);

const ICONO_CANDADO = (
  <svg className="h-4 w-4" fill="none" stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24">
    <path strokeLinecap="round" strokeLinejoin="round" d="M12 15v2m-6 4h12a2 2 0 002-2v-6a2 2 0 00-2-2H6a2 2 0 00-2 2v6a2 2 0 002 2zm10-10V7a4 4 0 10-8 0v2" />
  </svg>
);

function JugadorForm({ valores, errores, cargando, errorServidor, onChange, onBlur, onSubmit }) {
  return (
    <form
      onSubmit={onSubmit}
      className="space-y-5 rounded-2xl border border-ganker-purple bg-ganker-surface p-8"
    >
      <div className="grid gap-5 sm:grid-cols-2">
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
          label="EMAIL"
          icono={ICONO_MAIL}
          type="email"
          placeholder="tuemail@ejemplo.com"
          value={valores.mail}
          onChange={(e) => onChange("mail", e.target.value)}
          onBlur={() => onBlur("mail")}
          error={errores.mail}
        />
        <CampoTexto
          label="CONTRASEÑA"
          icono={ICONO_CANDADO}
          type="password"
          placeholder="Creá una contraseña"
          value={valores.password}
          onChange={(e) => onChange("password", e.target.value)}
          onBlur={() => onBlur("password")}
          error={errores.password}
        />
        <CampoTexto
          label="CONFIRMAR CONTRASEÑA"
          icono={ICONO_CANDADO}
          type="password"
          placeholder="Repetí tu contraseña"
          value={valores.confirmarPassword}
          onChange={(e) => onChange("confirmarPassword", e.target.value)}
          onBlur={() => onBlur("confirmarPassword")}
          error={errores.confirmarPassword}
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

      {errorServidor && (
        <p className="rounded-lg border border-ganker-error/40 bg-ganker-error/10 px-3 py-2 text-sm text-ganker-error font-body">
          {errorServidor}
        </p>
      )}

      <button
        type="submit"
        disabled={cargando}
        className="w-full rounded-lg bg-gradient-to-r from-ganker-orange to-ganker-purple py-3
          text-sm font-bold uppercase tracking-wide text-ganker-text font-heading transition
          hover:brightness-110 disabled:cursor-not-allowed disabled:opacity-60"
      >
        {cargando ? "Creando cuenta..." : "Crear mi cuenta"}
      </button>
    </form>
  );
}

export default JugadorForm;