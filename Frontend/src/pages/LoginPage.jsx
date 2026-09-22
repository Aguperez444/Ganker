import { useNavigate } from "react-router-dom";
import AuthLayout from "../components/common/AuthLayout";
import FormLogin from "../components/jugadores/FormLogin";
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
      />
    </AuthLayout>
  );
}

export default LoginPage;
