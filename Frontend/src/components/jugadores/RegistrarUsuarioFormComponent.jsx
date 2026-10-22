import CampoContrasenaComponent from "../common/CampoContrasenaComponent";
import CampoTexto from "../common/CampoTexto";
import { NOMBRES_ROLES } from "../../utils/rutas";

// US 39 - Formulario con el que un admin u owner registra a otro usuario.
// Solo pinta: el estado y las validaciones viven en useRegistrarUsuario.
function RegistrarUsuarioFormComponent({
  valores,
  errores,
  cargando,
  errorServidor,
  rolesPermitidos,
  onChange,
  onBlur,
  onSubmit,
}) {
  return (
    <form onSubmit={onSubmit} noValidate className="space-y-5">
      <div className="grid gap-5 sm:grid-cols-2">
        <CampoTexto
          label="NOMBRE DE PERFIL"
          placeholder="Nombre completo del usuario"
          value={valores.nombre}
          onChange={(e) => onChange("nombre", e.target.value)}
          onBlur={() => onBlur("nombre")}
          error={errores.nombre}
        />
        <CampoTexto
          label="NOMBRE DE USUARIO"
          placeholder="Username único"
          value={valores.username}
          onChange={(e) => onChange("username", e.target.value)}
          onBlur={() => onBlur("username")}
          error={errores.username}
        />
        <CampoTexto
          label="EMAIL"
          type="email"
          placeholder="usuario@ejemplo.com"
          value={valores.mail}
          onChange={(e) => onChange("mail", e.target.value)}
          onBlur={() => onBlur("mail")}
          error={errores.mail}
        />
        <div>
          <label
            htmlFor="registrar-usuario-rol"
            className="mb-1 block font-body text-xs font-semibold tracking-wide text-ganker-text"
          >
            ROL
          </label>
          <select
            id="registrar-usuario-rol"
            value={valores.rol}
            onChange={(e) => onChange("rol", e.target.value)}
            onBlur={() => onBlur("rol")}
            className={`w-full rounded-lg border bg-ganker-surface px-3 py-2.5 font-body text-sm text-ganker-text focus:ring-2 focus:ring-ganker-purple focus:outline-none ${
              errores.rol ? "border-ganker-error" : "border-ganker-purple"
            }`}
          >
            {rolesPermitidos.map((rol) => (
              <option key={rol} value={rol}>
                {NOMBRES_ROLES[rol]}
              </option>
            ))}
          </select>
          {errores.rol && (
            <p className="mt-1 text-xs text-ganker-error">{errores.rol}</p>
          )}
        </div>
        <CampoContrasenaComponent
          label="CONTRASEÑA"
          placeholder="Contraseña inicial"
          value={valores.password}
          onChange={(e) => onChange("password", e.target.value)}
          onBlur={() => onBlur("password")}
          error={errores.password}
        />
        <CampoContrasenaComponent
          label="CONFIRMAR CONTRASEÑA"
          placeholder="Repetí la contraseña"
          value={valores.confirmarPassword}
          onChange={(e) => onChange("confirmarPassword", e.target.value)}
          onBlur={() => onBlur("confirmarPassword")}
          error={errores.confirmarPassword}
        />
      </div>

      <p className="text-xs text-ganker-muted">
        La contraseña debe tener al menos 8 caracteres, una mayúscula, una
        minúscula y un número.
      </p>

      {errorServidor && (
        <div className="rounded-lg border border-ganker-error/20 bg-ganker-error/10 px-4 py-3">
          <p className="text-sm text-ganker-error">{errorServidor}</p>
        </div>
      )}

      <button
        type="submit"
        disabled={cargando}
        className="cursor-pointer rounded-lg bg-gradient-to-r from-ganker-orange via-ganker-orange-light to-ganker-purple px-4 py-2.5 text-sm font-semibold text-white shadow-lg transition hover:opacity-90 disabled:cursor-not-allowed disabled:opacity-50"
      >
        {cargando ? "Registrando..." : "Registrar usuario"}
      </button>
    </form>
  );
}

export default RegistrarUsuarioFormComponent;
