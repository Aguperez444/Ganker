import { useNavigate } from "react-router-dom";
import AuthLayout from "../components/common/AuthLayout";
import BotonesAuthFederadoComponent from "../components/jugadores/BotonesAuthFederadoComponent";
import JugadorForm from "../components/jugadores/JugadorForm";
import { useAuthFederado } from "../hooks/useAuthFederado";
import { useRegistrarJugador } from "../hooks/useRegistrarJugador";

function RegistroPage() {
  const {
    valores,
    errores,
    cargando,
    errorServidor,
    handleChange,
    handleBlur,
    handleSubmit,
  } = useRegistrarJugador();
  const { proveedorCargando, errorFederado, conectar } = useAuthFederado();
  const navigate = useNavigate();

  async function onSubmit(e) {
    const respuesta = await handleSubmit(e);
    if (!respuesta) return;
    navigate("/confirm-registration", {
      replace: true,
      state: { email: valores.mail, mensaje: respuesta.message },
    });
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
      >
        <BotonesAuthFederadoComponent
          proveedorCargando={proveedorCargando}
          error={errorFederado}
          deshabilitado={cargando}
          onConectar={conectar}
        />
      </JugadorForm>
    </AuthLayout>
  );
}

export default RegistroPage;
