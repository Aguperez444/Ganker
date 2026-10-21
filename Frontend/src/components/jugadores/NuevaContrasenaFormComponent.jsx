import { Link } from "react-router-dom";
import CampoContrasenaComponent from "../common/CampoContrasenaComponent";

const ICONO_CANDADO = (
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
      d="M12 15v2m-6 4h12a2 2 0 002-2v-6a2 2 0 00-2-2H6a2 2 0 00-2 2v6a2 2 0 002 2zm10-10V7a4 4 0 10-8 0v2"
    />
  </svg>
);

const CLASES_BOTON =
  "block w-full rounded-lg bg-gradient-to-r from-ganker-orange to-ganker-purple py-3 text-center text-sm font-bold uppercase tracking-wide text-ganker-text font-heading transition hover:brightness-110 disabled:cursor-not-allowed disabled:opacity-60";

// US 34 - Cambiar contraseña, paso 2 (se llega desde el link del mail).
// Con `exito` se reemplaza el formulario por la confirmacion.
function NuevaContrasenaFormComponent({
  valores,
  errores,
  cargando,
  errorServidor,
  exito,
  onChange,
  onSubmit,
}) {
  if (exito) {
    return (
      <div className="space-y-5 rounded-2xl border border-ganker-bg bg-ganker-surface p-8 shadow-[0_0px_10px] shadow-ganker-purple">
        <h1 className="font-heading text-xl font-bold text-ganker-text">
          Contraseña actualizada
        </h1>
        <p className="rounded-lg border border-ganker-success/40 bg-ganker-success/10 px-3 py-2 text-sm text-ganker-success font-body">
          ✓ {exito}. Ya podés iniciar sesión con tu nueva contraseña.
        </p>
        <Link to="/login" className={CLASES_BOTON}>
          Iniciar sesión
        </Link>
      </div>
    );
  }

  return (
    <form
      onSubmit={onSubmit}
      noValidate
      className="space-y-5 rounded-2xl border border-ganker-bg bg-ganker-surface p-8 shadow-[0_0px_10px] shadow-ganker-purple"
    >
      <div>
        <h1 className="font-heading text-xl font-bold text-ganker-text">
          Elegí tu nueva contraseña
        </h1>
        <p className="mt-1 text-sm text-ganker-muted font-body">
          Usá 8 caracteres o más, con al menos una mayúscula, una minúscula y un
          número.
        </p>
      </div>

      <CampoContrasenaComponent
        label="NUEVA CONTRASEÑA"
        icono={ICONO_CANDADO}
        placeholder="Tu nueva contraseña"
        value={valores.password}
        onChange={(e) => onChange("password", e.target.value)}
        error={errores.password}
      />
      <CampoContrasenaComponent
        label="CONFIRMAR CONTRASEÑA"
        icono={ICONO_CANDADO}
        placeholder="Repetí la nueva contraseña"
        value={valores.confirmarPassword}
        onChange={(e) => onChange("confirmarPassword", e.target.value)}
        error={errores.confirmarPassword}
      />

      {errorServidor && (
        <div className="rounded-lg border border-ganker-error/40 bg-ganker-error/10 px-3 py-2 text-sm text-ganker-error font-body">
          <p>{errorServidor}</p>
          <Link
            to="/recuperar-contrasena"
            className="mt-1 inline-block font-semibold underline"
          >
            Pedir un enlace nuevo
          </Link>
        </div>
      )}

      <button type="submit" disabled={cargando} className={CLASES_BOTON}>
        {cargando ? "Guardando..." : "Cambiar contraseña"}
      </button>
    </form>
  );
}

export default NuevaContrasenaFormComponent;
