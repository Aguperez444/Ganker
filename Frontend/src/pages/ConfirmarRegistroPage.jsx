import { useLocation, useSearchParams } from "react-router-dom";
import AuthLayout from "../components/common/AuthLayout";
import ConfirmarRegistroComponent from "../components/jugadores/ConfirmarRegistroComponent";
import ReenviarConfirmacionRegistroComponent from "../components/jugadores/ReenviarConfirmacionRegistroComponent";
import { useConfirmarRegistro } from "../hooks/useConfirmarRegistro";
import { useReenviarConfirmacionRegistro } from "../hooks/useReenviarConfirmacionRegistro";

function ConfirmarRegistroPage() {
  const [searchParams] = useSearchParams();
  const token = searchParams.get("token") ?? "";
  const { state } = useLocation();
  const confirmacion = useConfirmarRegistro(token);
  const reenvio = useReenviarConfirmacionRegistro(state?.email ?? "");

  return (
    <AuthLayout>
      <ConfirmarRegistroComponent
        token={token}
        mensaje={state?.mensaje}
        cargando={confirmacion.cargando}
        errorServidor={confirmacion.errorServidor}
        exito={confirmacion.exito}
        onConfirmar={confirmacion.handleConfirmar}
      >
        <ReenviarConfirmacionRegistroComponent
          email={reenvio.email}
          errores={reenvio.errores}
          cargando={reenvio.cargando}
          errorServidor={reenvio.errorServidor}
          enviado={reenvio.enviado}
          onChange={reenvio.setEmail}
          onSubmit={reenvio.handleSubmit}
        />
      </ConfirmarRegistroComponent>
    </AuthLayout>
  );
}

export default ConfirmarRegistroPage;
