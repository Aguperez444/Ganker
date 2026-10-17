import { Navigate, useLocation, useNavigate } from "react-router-dom";
import AuthLayout from "../components/common/AuthLayout";
import RegistroFederadoFormComponent from "../components/jugadores/RegistroFederadoFormComponent";
import { useAuth } from "../context/AuthContext";
import { useCompletarRegistroFederado } from "../hooks/useCompletarRegistroFederado";
import { rutaInicialPara } from "../utils/rutas";

function CompletarRegistroFederadoPage() {
  const location = useLocation();
  const navigate = useNavigate();
  const { guardarSesion } = useAuth();
  const {
    datosFederados,
    valores,
    errores,
    cargando,
    errorServidor,
    handleChange,
    handleBlur,
    handleSubmit,
    cancelar,
  } = useCompletarRegistroFederado(location.state);

  // Sin token de registro no hay nada que completar (entró a mano o ya lo usó).
  if (!datosFederados) {
    return <Navigate to="/registro" replace />;
  }

  async function onSubmit(e) {
    const tokens = await handleSubmit(e);
    if (!tokens) return;

    try {
      const usuario = await guardarSesion(tokens);
      navigate(rutaInicialPara(usuario), { replace: true });
    } catch {
      // Mismo caso que en RegistroPage: la cuenta ya se creó pero no pudimos
      // traer el perfil. Lo mandamos al login en vez de mostrarle un error
      // que lo haría intentar registrarse de nuevo.
      navigate("/login", {
        replace: true,
        state: {
          mensaje:
            "Tu cuenta se creo correctamente. Inicia sesion para entrar.",
        },
      });
    }
  }

  return (
    <AuthLayout>
      <RegistroFederadoFormComponent
        proveedor={datosFederados.provider}
        avatarUrl={datosFederados.avatar_url}
        valores={valores}
        errores={errores}
        cargando={cargando}
        errorServidor={errorServidor}
        onChange={handleChange}
        onBlur={handleBlur}
        onSubmit={onSubmit}
        onCancelar={cancelar}
      />
    </AuthLayout>
  );
}

export default CompletarRegistroFederadoPage;
