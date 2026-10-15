from collections import Counter
from dataclasses import dataclass, field
from typing import Optional

from app.domain.models.lol_stats import LolMatch

MOST_PLAYED_LIMIT = 3


@dataclass(frozen=True)
class LolChampionRecentStats:
    champion_name: str
    icon_url: Optional[str]
    games: int
    wins: int
    kda: float

    @property
    def winrate(self) -> float:
        return round(self.wins * 100 / self.games, 1) if self.games else 0.0


@dataclass(frozen=True)
class LolRecentSummary:
    games: int
    wins: int
    losses: int
    winrate: float
    avg_kills: float
    avg_deaths: float
    avg_assists: float
    kda: float
    main_role: Optional[str]
    most_played: list[LolChampionRecentStats] = field(default_factory=list)

@dataclass
class _ChampionAccumulator:
    champion_name: str
    icon_url: Optional[str]
    games: int = 0
    wins: int = 0
    kills: int = 0
    deaths: int = 0
    assists: int = 0

def _kda(kills: int, deaths: int, assists: int) -> float:
    # Sin muertes, el KDA es kills + asistencias (convención de los sitios de estadísticas)
    return round((kills + assists) / max(deaths, 1), 2)


class LolStatsSummaryService:

    @staticmethod
    def summarize(matches: list[LolMatch]) -> LolRecentSummary:
        """Resume las últimas partidas: winrate, KDA promedio, rol más jugado y campeones más jugados."""
        games = len(matches)
        if games == 0:
            return LolRecentSummary(games=0, wins=0, losses=0, winrate=0.0, avg_kills=0.0, avg_deaths=0.0,
                                    avg_assists=0.0, kda=0.0, main_role=None, most_played=[])

        wins = 0
        kills = 0
        deaths = 0
        assists = 0
        roles: Counter[str] = Counter()


        for match in matches:
            if match.win:
                wins += 1
            kills += match.kills
            deaths += match.deaths
            assists += match.assists
            if match.role:
                roles[match.role] += 1

        main_role = roles.most_common(1)[0][0] if roles else None

        return LolRecentSummary(
            games=games,
            wins=wins,
            losses=games - wins,
            winrate=round(wins * 100 / games, 1),
            avg_kills=round(kills / games, 1),
            avg_deaths=round(deaths / games, 1),
            avg_assists=round(assists / games, 1),
            kda=_kda(kills, deaths, assists),
            main_role=main_role,
            most_played=LolStatsSummaryService._most_played(matches),
        )


    @staticmethod
    def _most_played(matches: list[LolMatch]) -> list[LolChampionRecentStats]:
        by_champion: dict[str, _ChampionAccumulator] = {}

        for match in matches:
            champion = by_champion.setdefault( # este setdefault obtiene el acumulador para el campeón, o lo crea si no existe
                match.champion_name,
                _ChampionAccumulator(
                    champion_name=match.champion_name,
                    icon_url=match.champion_icon_url,
                ),
            )

            champion.games += 1
            champion.wins += 1 if match.win else 0
            champion.kills += match.kills
            champion.deaths += match.deaths
            champion.assists += match.assists

        ordered = sorted(
            by_champion.values(),
            key=lambda champion: (-champion.games, -champion.wins),
        )

        return [
            LolChampionRecentStats(
                champion_name=champion.champion_name,
                icon_url=champion.icon_url,
                games=champion.games,
                wins=champion.wins,
                kda=_kda(
                    champion.kills,
                    champion.deaths,
                    champion.assists,
                ),
            )
            for champion in ordered[:MOST_PLAYED_LIMIT]
        ]