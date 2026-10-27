// Items de navegacion de los menus laterales (escritorio y mobile). Viven en
// un archivo aparte para que los componentes solo exporten componentes
// (regla react-refresh/only-export-components).

export const navigationItems = [
  {
    label: "Inicio",
    path: "/app",
    end: true,
  },
  {
    label: "Buscar",
    path: "/app/jugadores",
  },
  {
    label: "Equipos",
    path: "/app/equipos",
  },
  {
    label: "Perfiles de juego",
    path: "/app/perfil",
  },
  // "Cuenta" (/app/cuenta) vive en el menu desplegable del avatar, en el
  // TopNavbar, junto a "Cerrar sesion". No se duplica aca.
];

export const adminNavigationItems = [
  {
    label: "Inicio",
    path: "/app/admin",
    end: true,
  },
  {
    label: "Juegos",
    path: "/app/admin/games",
  },
  {
    label: "Rangos",
    path: "/app/admin/ranks",
  },
  {
    label: "Roles",
    path: "/app/admin/roles",
  },
  {
    label: "Personajes",
    path: "/app/admin/characters",
  },
  {
    label: "Regiones",
    path: "/app/admin/regions",
  },
  {
    label: "Reportes",
    path: "/app/admin/reportes",
  },
  {
    label: "Usuarios",
    path: "/app/admin/usuarios",
  },
  {
    label: "Moderación",
    path: "/app/admin/moderacion",
  },
];
