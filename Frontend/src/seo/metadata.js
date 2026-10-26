export const SITE_URL = "https://gankerweb.app";

const HOME_DESCRIPTION =
  "Ganker (gankerweb.app) es la plataforma para gamers donde encontrás equipo, creás lobbies en tiempo real y conectás con jugadores de League of Legends, CS2, Overwatch 2 y más.";

// También se usan al compilar los HTML y las rutas de Nginx. Al agregar una
// pantalla en AppRouter, agregar acá su ruta para permitir el acceso directo.
export const PAGE_METADATA = [
  {
    path: "/",
    title: "Ganker | Plataforma para Encontrar Equipo, Lobbies y Jugadores",
    description: HOME_DESCRIPTION,
    indexable: true,
    socialTitle: "Ganker — Encontrá tu equipo ideal y dominá la partida",
    socialDescription:
      "Unite a lobbies en tiempo real, filtrá por rango y rol, y chateá con tu próximo squad en Ganker.",
    twitterTitle: "Ganker | Tu plataforma de LFG y Matchmaking",
    twitterDescription:
      "Dejá de jugar con randoms. Encontrá tu squad en tiempo real en Ganker.",
  },
  {
    path: "/login",
    title: "Iniciar sesión | Ganker",
    description:
      "Iniciá sesión en Ganker para conectar con jugadores y gestionar tus equipos.",
  },
  {
    path: "/registro",
    title: "Crear cuenta | Ganker",
    description:
      "Creá tu cuenta de Ganker para encontrar jugadores y formar tu equipo.",
  },
  {
    path: "/recuperar-contrasena",
    title: "Recuperar contraseña | Ganker",
    description:
      "Solicitá un enlace para recuperar el acceso a tu cuenta de Ganker.",
  },
  {
    path: "/reset-password",
    title: "Restablecer contraseña | Ganker",
    description: "Elegí una nueva contraseña para tu cuenta de Ganker.",
  },
  {
    path: "/confirm-registration",
    title: "Confirmar cuenta | Ganker",
    description: "Confirmá tu correo para completar el registro en Ganker.",
  },
  {
    path: "/confirm-email-change",
    title: "Confirmar nuevo email | Ganker",
    description:
      "Confirmá tu nuevo correo para actualizar el email de tu cuenta.",
  },
  {
    path: "/auth/callback/:provider",
    title: "Conectando tu cuenta | Ganker",
    description:
      "Completá el inicio de sesión con tu cuenta vinculada a Ganker.",
  },
  {
    path: "/completar-registro",
    title: "Completar registro | Ganker",
    description: "Completá los datos de tu cuenta para empezar a usar Ganker.",
  },
  ...[
    ["/app", "Mi inicio"],
    ["/app/perfil", "Perfiles de juego"],
    ["/app/cuenta", "Mi cuenta"],
    ["/app/discord/callback", "Conectar Discord"],
    ["/app/jugadores", "Buscar jugadores"],
    ["/app/jugadores/:jugadorId", "Perfil de jugador"],
    ["/app/buscar", "Buscar jugadores"],
    ["/app/equipos", "Equipos"],
    ["/app/equipos/crear", "Crear equipo"],
    ["/app/equipos/mi-equipo", "Mi equipo"],
    ["/app/equipos/:equipoId", "Detalle de equipo"],
    ["/app/admin", "Administración"],
    ["/app/admin/games", "Administrar videojuegos"],
    ["/app/admin/ranks", "Administrar rangos"],
    ["/app/admin/roles", "Administrar roles"],
    ["/app/admin/regions", "Administrar regiones"],
    ["/app/admin/reportes", "Reportes por videojuego"],
    ["/app/admin/reportes/uso", "Reportes de uso"],
    ["/app/admin/usuarios", "Administrar usuarios"],
    ["/app/admin/characters", "Administrar personajes"],
    ["/app/admin/personajes", "Administrar personajes"],
    ["/app/admin/moderacion", "Moderación"],
  ].map(([path, title]) => ({
    path,
    title: `${title} | Ganker`,
    description: `${title}. Accedé a tu cuenta para usar esta sección de Ganker.`,
  })),
];

export const NOT_FOUND_METADATA = {
  title: "Página no encontrada | Ganker",
  description:
    "La página que buscás no existe o ya no está disponible. Volvé al inicio de Ganker.",
};

export const SITE_STRUCTURED_DATA = {
  "@context": "https://schema.org",
  "@graph": [
    {
      "@type": "WebSite",
      "@id": `${SITE_URL}/#website`,
      name: "Ganker",
      alternateName: ["Ganker Web", "Ganker App"],
      url: `${SITE_URL}/`,
      inLanguage: "es",
    },
    {
      "@type": "WebApplication",
      "@id": `${SITE_URL}/#application`,
      name: "Ganker",
      alternateName: [
        "Ganker Web",
        "Ganker App",
        "Ganker LFG",
        "gankerweb.app",
      ],
      url: `${SITE_URL}/`,
      applicationCategory: "GameApplication",
      operatingSystem: "Web",
      inLanguage: "es",
      description:
        "Ganker (gankerweb.app) es una plataforma web de LFG (Looking For Group) y matchmaking por nivel real para gamers en español. Permite encontrar equipo, crear lobbies en tiempo real, gestionar perfiles competitivos por juego, rol y rango, y conectar con jugadores de League of Legends, Valorant, Counter-Strike 2, Overwatch 2 y más.",
      image: `${SITE_URL}/og-banner.png`,
      offers: { "@type": "Offer", price: "0", priceCurrency: "USD" },
    },
  ],
};

export function routePattern(path) {
  if (path === "/") return "/";
  return `${path
    .split("/")
    .map((part) =>
      part.startsWith(":")
        ? "[^/]+"
        : part.replace(/[.*+?^${}()|[\]\\]/g, "\\$&")
    )
    .join("/")}/?`;
}

export function getPageMetadata(pathname) {
  const page =
    PAGE_METADATA.find(({ path }) =>
      new RegExp(`^${routePattern(path)}$`, "i").test(pathname)
    ) ?? NOT_FOUND_METADATA;

  return {
    ...page,
    robots: page.indexable ? "index, follow" : "noindex, follow",
    canonical: page.indexable ? `${SITE_URL}/` : null,
    // No propagar tokens ni parámetros de OAuth a los metadatos.
    url:
      page.path && !page.path.includes(":") ? `${SITE_URL}${page.path}` : null,
    socialTitle: page.socialTitle ?? page.title,
    socialDescription: page.socialDescription ?? page.description,
    twitterTitle: page.twitterTitle ?? page.title,
    twitterDescription: page.twitterDescription ?? page.description,
  };
}
