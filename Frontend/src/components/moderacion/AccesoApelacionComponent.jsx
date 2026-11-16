import { useState } from "react";
import ModalApelarBaneoComponent from "./ModalApelarBaneoComponent";

export default function AccesoApelacionComponent({ token }) {
  const [abierto, setAbierto] = useState(false);
  if (!token) return null;
  return (
    <>
      <div className="rounded-xl border border-ganker-purple/30 bg-ganker-purple/10 p-4 text-left">
        <p className="text-sm text-ganker-text">
          Si considerás que la sanción fue un error, podés apelar.
        </p>
        <button
          type="button"
          onClick={() => setAbierto(true)}
          className="mt-3 cursor-pointer rounded-lg border border-ganker-purple-light/40 px-4 py-2 text-sm font-semibold text-ganker-purple-light hover:bg-ganker-purple/20"
        >
          Iniciar una apelación
        </button>
      </div>
      {abierto && (
        <ModalApelarBaneoComponent
          token={token}
          onClose={() => setAbierto(false)}
        />
      )}
    </>
  );
}
