import { useNavigate } from "react-router-dom";
import AuthLayout from "../components/common/AuthLayout";
import FormLogin from "../components/jugadores/FormLogin";
import { useIniciarSesion } from "../hooks/useIniciarSesion";

function LoginPage() {
  const { valores, errores, cargando, errorServidor, handleChange, handleSubmit } =
    useIniciarSesion();
  const navigate = useNavigate();

  async function onSubmit(e) {
    const exito = await handleSubmit(e);
    if (exito) {
          navigate("/app", { replace: true });;
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