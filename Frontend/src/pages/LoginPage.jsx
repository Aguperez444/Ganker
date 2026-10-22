import { useLocation, useNavigate } from "react-router-dom";
import AuthLayout from "../components/common/AuthLayout";
import BotonesAuthFederadoComponent from "../components/jugadores/BotonesAuthFederadoComponent";
import FormLogin from "../components/jugadores/FormLogin";
import { useAuthFederado } from "../hooks/useAuthFederado";
import { useIniciarSesion } from "../hooks/useIniciarSesion";
import { rutaInicialPara } from "../utils/rutas";

function LoginPage() {
  const {
    valores,
    errores,
    cargando,
    errorServidor,
    handleChange,
    handleSubmit,
  } = useIniciarSesion();
  const { proveedorCargando, errorFederado, conectar } = useAuthFederado();
  const navigate = useNavigate();
  // Aviso que deja otra pantalla al mandar aca (ej. la baja de la cuenta,
  // US 04, en useEliminarCuenta).
  const mensaje = useLocation().state?.mensaje;

  async function onSubmit(e) {
    const usuario = await handleSubmit(e);
    if (usuario) {
      // Los admin y owner arrancan en el panel; el resto en la home.
      navigate(rutaInicialPara(usuario), { replace: true });
    }
  }

  return (
    <AuthLayout>
      {mensaje && (
        <div className="mb-4 rounded-lg border border-ganker-success/20 bg-ganker-success/10 px-4 py-3">
          <p className="text-sm text-ganker-success">✓ {mensaje}</p>
        </div>
      )}
      <FormLogin
        valores={valores}
        errores={errores}
        cargando={cargando}
        errorServidor={errorServidor}
        onChange={handleChange}
        onSubmit={onSubmit}
      >
        <BotonesAuthFederadoComponent
          proveedorCargando={proveedorCargando}
          error={errorFederado}
          deshabilitado={cargando}
          onConectar={conectar}
        />
      </FormLogin>
    </AuthLayout>
  );
}

export default LoginPage;
