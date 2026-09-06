import { useNavigate } from "react-router-dom";
import AuthLayout from "../components/common/AuthLayout";
import JugadorForm from "../components/jugadores/JugadorForm";
import { useRegistrarJugador } from "../hooks/useRegistrarJugador";
import { useAuth } from "../context/AuthContext";

function RegistroPage() {
  const { valores, errores, cargando, errorServidor, handleChange, handleBlur, handleSubmit } =
    useRegistrarJugador();
  const { guardarSesion } = useAuth();
  const navigate = useNavigate();

  async function onSubmit(e) {
    const tokens = await handleSubmit(e);
    if (tokens) {
      guardarSesion(tokens);
      navigate("/app", { replace: true });
    }
  }

  return (
    <AuthLayout>
      <JugadorForm
        valores={valores}
        errores={errores}
        cargando={cargando}
        errorServidor={errorServidor}
        onChange={handleChange}
        onBlur={handleBlur}
        onSubmit={onSubmit}
      />
    </AuthLayout>
  );
}

export default RegistroPage;