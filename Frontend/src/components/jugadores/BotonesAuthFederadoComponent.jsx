import IconoProveedorFederadoComponent from "../common/IconoProveedorFederadoComponent";
import { PROVEEDORES_FEDERADOS } from "../../utils/proveedoresFederados";

// Botones "O continuá con ..." de login y registro. El estado y la llamada al
// backend viven en useAuthFederado; acá solo se dibuja.
function BotonesAuthFederadoComponent({
  proveedorCargando,
  error,
  deshabilitado = false,
  onConectar,
}) {
  return (
    <div className="space-y-4 pt-2">
      <div className="relative flex items-center justify-center">
        <div className="w-full border-t border-white/10" />
        <span className="bg-ganker-surface px-3 text-xs font-semibold tracking-wider text-ganker-muted uppercase font-heading whitespace-nowrap">
          O continuá con
        </span>
        <div className="w-full border-t border-white/10" />
      </div>

      {error && (
        <p
          role="alert"
          className="rounded-lg border border-ganker-error/40 bg-ganker-error/10 px-3 py-2 text-xs text-ganker-error font-body"
        >
          {error}
        </p>
      )}

      <div className="grid grid-cols-2 gap-3">
        {PROVEEDORES_FEDERADOS.map((prov) => (
          <button
            key={prov.id}
            type="button"
            disabled={deshabilitado || Boolean(proveedorCargando)}
            onClick={() => onConectar(prov.id)}
            className={`flex cursor-pointer items-center justify-center gap-2.5 rounded-lg border border-white/10 bg-ganker-bg/70 px-4 py-2.5 text-sm font-semibold text-ganker-text font-heading transition ${prov.clasesHover} disabled:cursor-not-allowed disabled:opacity-60`}
          >
            <IconoProveedorFederadoComponent proveedor={prov.id} />
            <span>
              {proveedorCargando === prov.id ? "Conectando..." : prov.nombre}
            </span>
          </button>
        ))}
      </div>
    </div>
  );
}

export default BotonesAuthFederadoComponent;
