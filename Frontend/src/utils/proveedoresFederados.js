// Proveedores de identidad federada que soporta el backend
// (/auth/v1/oauth/{provider}/...). El `id` es el mismo que espera la URL.
// Los íconos viven aparte, en IconoProveedorFederadoComponent, para que este
// archivo quede como datos puros.
export const PROVEEDORES_FEDERADOS = [
  {
    id: "discord",
    nombre: "Discord",
    clasesHover: "hover:border-[#5865F2]/60 hover:bg-[#5865F2]/10",
  },
  {
    id: "steam",
    nombre: "Steam",
    clasesHover: "hover:border-[#66c0f4]/60 hover:bg-[#66c0f4]/10",
  },
  {
    id: "twitch",
    nombre: "Twitch",
    clasesHover: "hover:border-[#9146FF]/60 hover:bg-[#9146FF]/10",
  },
  {
    id: "google",
    nombre: "Google",
    clasesHover: "hover:border-white/30 hover:bg-white/10",
  },
];

// Clave de sessionStorage donde el callback deja los datos del registro
// pendiente, para que /completar-registro sobreviva a un F5.
export const CLAVE_REGISTRO_FEDERADO = "ganker_registro_federado";

// Nombre visible del proveedor; si el backend manda uno que no conocemos,
// mostramos el id tal cual en vez de romper la pantalla.
export function nombreProveedorFederado(id) {
  return PROVEEDORES_FEDERADOS.find((p) => p.id === id)?.nombre ?? id;
}
