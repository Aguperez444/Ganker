// Servidores de League of Legends. `value` es el codigo de plataforma de Riot
// y tiene que coincidir con el enum LolServer del backend
// (domain/models/lol_server.py).
export const SERVIDORES_LOL = [
  { value: "la2", label: "LAS - Latinoamérica Sur" },
  { value: "la1", label: "LAN - Latinoamérica Norte" },
  { value: "br1", label: "BR - Brasil" },
  { value: "na1", label: "NA - Norteamérica" },
  { value: "euw1", label: "EUW - Europa Oeste" },
  { value: "eun1", label: "EUNE - Europa Nórdica y Este" },
  { value: "tr1", label: "TR - Turquía" },
  { value: "ru", label: "RU - Rusia" },
  { value: "me1", label: "ME - Medio Oriente" },
  { value: "kr", label: "KR - Corea" },
  { value: "jp1", label: "JP - Japón" },
  { value: "oc1", label: "OCE - Oceanía" },
  { value: "sg2", label: "SEA - Sudeste Asiático" },
  { value: "tw2", label: "TW - Taiwán" },
  { value: "vn2", label: "VN - Vietnam" },
];

// Regiones de Valorant: las informa Riot ("active shard") al vincular.
const REGIONES_VALORANT = {
  latam: "LATAM",
  na: "NA",
  br: "BR",
  eu: "EU",
  ap: "Asia-Pacífico",
  kr: "KR",
};

// Nombre corto de un servidor de LoL ("la2" -> "LAS") o de una region de
// Valorant ("latam" -> "LATAM").
export function nombreServidor(codigo) {
  const servidor = SERVIDORES_LOL.find((s) => s.value === codigo);
  if (servidor) return servidor.label.split(" - ")[0];
  return REGIONES_VALORANT[codigo] ?? codigo;
}

// Mismo formato que valida el backend (RiotIdService): Nombre#TAG.
export function esRiotIdValido(riotId) {
  return /^[^#]{3,16}#[A-Za-z0-9]{3,5}$/.test((riotId ?? "").trim());
}

export function formatearDuracion(segundos) {
  const minutos = Math.floor(segundos / 60);
  const resto = String(segundos % 60).padStart(2, "0");
  return `${minutos}:${resto}`;
}

export function formatearPuntos(puntos) {
  return puntos >= 1000
    ? `${(puntos / 1000).toFixed(puntos >= 100000 ? 0 : 1)}k`
    : String(puntos);
}
