import { Link, useSearchParams } from "react-router-dom";
import AuthLayout from "../components/common/AuthLayout";
import NuevaContrasenaFormComponent from "../components/jugadores/NuevaContrasenaFormComponent";
import {
  MENSAJE_LINK_INVALIDO,
  useRestablecerContrasena,
} from "../hooks/useRestablecerContrasena";

// US 34 - Cambiar contraseña, paso 2. Es la pantalla del link del mail: el
// backend lo arma como {FRONTEND_URL}/reset-password?token=..., asi que la
// ruta tiene que llamarse exactamente asi (ver AppRouter).
function RestablecerContrasenaPage() {
  const [searchParams] = useSearchParams();
  const token = searchParams.get("token") ?? "";
  const {
    valores,
    errores,
    cargando,
    errorServidor,
    exito,
    handleChange,
    handleSubmit,
  } = useRestablecerContrasena(token);

  return (
    <AuthLayout>
      {token ? (
        <NuevaContrasenaFormComponent
          valores={valores}
          errores={errores}
          cargando={cargando}
          errorServidor={errorServidor}
          exito={exito}
          onChange={handleChange}
          onSubmit={handleSubmit}
        />
      ) : (
        <div className="space-y-4 rounded-2xl border border-ganker-bg bg-ganker-surface p-8 shadow-[0_0px_10px] shadow-ganker-purple">
          <p className="rounded-lg border border-ganker-error/40 bg-ganker-error/10 px-3 py-2 text-sm text-ganker-error font-body">
            {MENSAJE_LINK_INVALIDO}
          </p>
          <Link
            to="/recuperar-contrasena"
            className="inline-block text-sm font-semibold text-ganker-purple-light hover:underline"
          >
            Pedir un enlace nuevo
          </Link>
        </div>
      )}
    </AuthLayout>
  );
}

export default RestablecerContrasenaPage;
