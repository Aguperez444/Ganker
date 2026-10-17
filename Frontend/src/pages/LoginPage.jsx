import { useNavigate } from "react-router-dom";
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

  async function onSubmit(e) {
    const usuario = await handleSubmit(e);
    if (usuario) {
      // Los admin y owner arrancan en el panel; el resto en la home.
      navigate(rutaInicialPara(usuario), { replace: true });
    }
  }

  return (
    <AuthLayout>
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
