from dataclasses import dataclass, field
from datetime import datetime
from typing import Optional

# Valores inmutables con las estadísticas que devuelve la API de Riot para una cuenta de League of Legends.
# Se guardan tal cual en la base (como "foto" de la última actualización) y los promedios
# se calculan al leerlos con LolStatsSummaryService.


@dataclass(frozen=True)
class LolRankedEntry:
    queue_type: str           # Código de Riot: "RANKED_SOLO_5x5" o "RANKED_FLEX_SR"
    queue: str                # Nombre para mostrar: "Solo/Dúo", "Flexible"
    tier: str                 # Liga en español: "Oro", "Diamante"...
    division: Optional[str]   # "I" a "IV"; None en Maestro, Gran Maestro y Retador
    league_points: int
    wins: int
    losses: int

    @property
    def winrate(self) -> float:
        games = self.wins + self.losses
        return round(self.wins * 100 / games, 1) if games else 0.0


@dataclass(frozen=True)
class LolChampionMastery:
    champion_name: str
    icon_url: Optional[str]
    level: int
    points: int


@dataclass(frozen=True)
class LolMatch:
    match_id: str
    champion_name: str
    champion_icon_url: Optional[str]
    kills: int
    deaths: int
    assists: int
    win: bool
    role: Optional[str]       # "Top", "Jungla", "Mid", "ADC", "Support"; None si el modo no tiene roles
    cs: int
    duration_seconds: int
    queue: str                # "Solo/Dúo", "ARAM", "Normal"...
    played_at: datetime


@dataclass(frozen=True)
class LolStats:
    summoner_level: int
    profile_icon_url: Optional[str]
    ranked: list[LolRankedEntry] = field(default_factory=list)
    top_masteries: list[LolChampionMastery] = field(default_factory=list)
    matches: list[LolMatch] = field(default_factory=list)
