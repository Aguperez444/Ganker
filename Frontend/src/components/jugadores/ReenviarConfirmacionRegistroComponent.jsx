import CampoTexto from "../common/CampoTexto";

function ReenviarConfirmacionRegistroComponent({
  email,
  errores,
  cargando,
  errorServidor,
  enviado,
  onChange,
  onSubmit,
}) {
  return (
    <form onSubmit={onSubmit} noValidate className="space-y-4">
      <p className="text-sm text-ganker-muted font-body">
        Revisá también spam. Si no recibiste el correo o el enlace venció, pedí
        uno nuevo. Cada reenvío invalida el enlace anterior.
      </p>
      <CampoTexto
        label="EMAIL"
        aria-label="Email de registro"
        type="email"
        autoComplete="email"
        value={email}
        onChange={(e) => onChange(e.target.value)}
        error={errores.email}
      />
      {enviado && (
        <p role="status" className="text-sm text-ganker-success font-body">
          {enviado}
        </p>
      )}
      {errorServidor && (
        <p role="alert" className="text-sm text-ganker-error font-body">
          {errorServidor}
        </p>
      )}
      <button
        type="submit"
        disabled={cargando}
        className="w-full rounded-lg border border-ganker-purple py-3 text-sm font-bold text-ganker-purple-light transition hover:brightness-110 disabled:cursor-not-allowed disabled:opacity-60"
      >
        {cargando ? "Enviando..." : "Reenviar confirmación"}
      </button>
    </form>
  );
}

export default ReenviarConfirmacionRegistroComponent;
