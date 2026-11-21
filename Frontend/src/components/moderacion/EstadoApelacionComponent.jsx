import { ESTADOS_APELACION } from "../../utils/apelaciones";

const ESTILOS = {
  pending: "text-ganker-orange-light",
  accepted: "text-ganker-success",
  rejected: "text-ganker-error",
};

export default function EstadoApelacionComponent({ estado }) {
  return (
    <span
      className={`shrink-0 text-xs font-medium whitespace-nowrap ${ESTILOS[estado] || "text-ganker-muted"}`}
    >
      Estado: {ESTADOS_APELACION[estado] || estado}
    </span>
  );
}
