import { useLocation } from "react-router-dom";
import AuthLayout from "../components/common/AuthLayout";
import RecuperarContrasenaFormComponent from "../components/jugadores/RecuperarContrasenaFormComponent";
import { useRecuperarContrasena } from "../hooks/useRecuperarContrasena";

// US 34 - Cambiar contraseña, paso 1. Se llega desde "¿Olvidaste tu
// contraseña?" del login o desde Mi cuenta (que manda el mail en el state
// para dejarlo precargado).
function RecuperarContrasenaPage() {
  const emailInicial = useLocation().state?.email ?? "";
  const {
    valores,
    errores,
    cargando,
    errorServidor,
    enviado,
    handleChange,
    handleSubmit,
  } = useRecuperarContrasena(emailInicial);

  return (
    <AuthLayout>
      <RecuperarContrasenaFormComponent
        valores={valores}
        errores={errores}
        cargando={cargando}
        errorServidor={errorServidor}
        enviado={enviado}
        onChange={handleChange}
        onSubmit={handleSubmit}
      />
    </AuthLayout>
  );
}

export default RecuperarContrasenaPage;
