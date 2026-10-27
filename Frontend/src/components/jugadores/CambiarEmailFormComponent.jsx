import CampoTexto from "../common/CampoTexto";
import CampoContrasenaComponent from "../common/CampoContrasenaComponent";

function CambiarEmailFormComponent({
  mailActual,
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
      noValidate
      className="space-y-5 rounded-2xl border border-white/10 bg-ganker-surface p-6 sm:p-8"
    >
      <div>
        <h2 className="font-heading text-lg font-semibold text-ganker-text">
          Cambiar email
        </h2>
        <p className="mt-1 text-sm text-ganker-muted">
          Correo actual: {mailActual || "Sin correo asociado"}. El cambio se
          aplicará cuando confirmes el enlace que enviaremos al nuevo correo.
        </p>
      </div>
      <CampoTexto
        label="NUEVO EMAIL"
        aria-label="Nuevo email"
        type="email"
        autoComplete="email"
        placeholder="nuevoemail@ejemplo.com"
        value={valores.mail}
        disabled={cargando}
        onChange={(e) => onChange("mail", e.target.value)}
        onBlur={() => onBlur("mail")}
        error={errores.mail}
      />
      <CampoContrasenaComponent
        label="CONTRASEÑA ACTUAL"
        aria-label="Contraseña actual"
        autoComplete="current-password"
        placeholder="Tu contraseña actual"
        value={valores.password}
        disabled={cargando}
        onChange={(e) => onChange("password", e.target.value)}
        onBlur={() => onBlur("password")}
        error={errores.password}
      />
      {errorServidor && (
        <p role="alert" className="text-sm text-ganker-error">
          {errorServidor}
        </p>
      )}
      {exito && (
        <p role="status" className="text-sm text-ganker-success">
          {exito}
        </p>
      )}
      <button
        type="submit"
        disabled={cargando}
        className="rounded-lg border border-ganker-purple-light/40 px-4 py-2.5 text-sm font-semibold text-ganker-purple-light transition hover:bg-ganker-purple/20 disabled:cursor-not-allowed disabled:opacity-60"
      >
        {cargando ? "Enviando..." : "Enviar confirmación de email"}
      </button>
    </form>
  );
}

export default CambiarEmailFormComponent;
