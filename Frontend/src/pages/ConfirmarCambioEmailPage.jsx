import { useSearchParams } from "react-router-dom";
import AuthLayout from "../components/common/AuthLayout";
import ConfirmarCambioEmailComponent from "../components/jugadores/ConfirmarCambioEmailComponent";
import { useConfirmarCambioEmail } from "../hooks/useConfirmarCambioEmail";

function ConfirmarCambioEmailPage() {
  const [searchParams] = useSearchParams();
  const token = searchParams.get("token") ?? "";
  const { cargando, errorServidor, exito, handleConfirmar } =
    useConfirmarCambioEmail(token);

  return (
    <AuthLayout>
      <ConfirmarCambioEmailComponent
        token={token}
        cargando={cargando}
        errorServidor={errorServidor}
        exito={exito}
        onConfirmar={handleConfirmar}
      />
    </AuthLayout>
  );
}

export default ConfirmarCambioEmailPage;
