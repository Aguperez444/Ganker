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
    if (!tokens) return;

    try {
      await guardarSesion(tokens);
      navigate("/app", { replace: true });
    } catch {
      // La cuenta se creo, pero no pudimos traer el perfil. guardarSesion ya
      // dejo la sesion limpia, asi que lo mandamos a loguearse en vez de
      // dejarlo mirando el formulario sin saber que su cuenta ya existe.
      navigate("/login", {
        replace: true,
        state: { mensaje: "Tu cuenta se creo correctamente. Inicia sesion para entrar." },
      });
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
