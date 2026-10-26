// Portadas de los juegos (las mismas de la landing, en Public/images/games).
// El backend guarda el nombre del videojuego como texto libre ("Overwatch",
// "Counter Strike 2"...), asi que se reconoce con un patron por juego.
const PORTADAS_JUEGOS = [
  {
    patron: /valorant/,
    imagen: "/images/games/valorant.webp",
    posicion: "center 5%",
  },
  {
    patron: /league of legends|\blol\b/,
    imagen: "/images/games/lol.webp",
    posicion: "center 12%",
  },
  {
    patron: /counter[- ]?strike|\bcs ?2\b|\bcs:?go\b/,
    imagen: "/images/games/cs2.webp",
    posicion: "center 20%",
  },
  {
    patron: /overwatch/,
    imagen: "/images/games/ow.webp",
    posicion: "center 75%",
  },
];

// Devuelve { imagen, posicion } o null si el juego no tiene portada propia.
export function portadaDeJuego(nombre) {
  const normalizado = (nombre ?? "").toLowerCase();
  if (!normalizado) return null;

  const portada = PORTADAS_JUEGOS.find(({ patron }) =>
    patron.test(normalizado)
  );
  return portada
    ? { imagen: portada.imagen, posicion: portada.posicion }
    : null;
}

// Rol con el rango mas alto del perfil (por `rank.value`), o null si el
// perfil no tiene roles cargados. Es el que se muestra como "rango principal".
export function rolConMejorRango(perfil) {
  const roles = (perfil?.role_profiles ?? []).filter((rp) => rp.rank);
  if (roles.length === 0) return null;

  return roles.reduce((mejor, actual) =>
    actual.rank.value > mejor.rank.value ? actual : mejor
  );
}
