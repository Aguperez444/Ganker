import { useNavigate } from "react-router-dom";
import AuthLayout from "../components/common/AuthLayout";
import JugadorForm from "../components/jugadores/JugadorForm";
import { useRegistrarJugador } from "../hooks/useRegistrarJugador";

function RegistroPage() {
  const { valores, errores, cargando, errorServidor, handleChange, handleBlur, handleSubmit } =
    useRegistrarJugador();
  const navigate = useNavigate();

  async function onSubmit(e) {
    const tokens = await handleSubmit(e);
    if (tokens) {
      // Por ahora, si el registro sale bien, solo redirige a Home sin
      // guardar sesion (no hay logueo automatico todavia).
      //
      // Cuando se arme el login, quien lo haga deberia:
      //   1. Crear la sesion global (ej. src/context/AuthContext.jsx) que
      //      guarde el token (localStorage) y le diga al resto de la app
      //      si hay alguien logueado.
      //   2. Reemplazar el navigate("/") de aca abajo por algo como:
      //        guardarSesion(tokens);   // el metodo que exponga esa sesion
      //        navigate("/");
      //      usando estos mismos "tokens" que ya devuelve handleSubmit.
      //   3. El propio login (useIniciarSesion.js, cuando exista) va a
      //      necesitar hacer exactamente el mismo guardarSesion(tokens)
      //      con sus propios tokens al iniciar sesion.
      navigate("/");
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