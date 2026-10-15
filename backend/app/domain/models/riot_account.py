from dataclasses import dataclass


@dataclass(frozen=True)
class RiotAccount:
    """Cuenta de Riot Games (la misma para League of Legends y Valorant)."""
    puuid: str
    game_name: str
    tag_line: str

    @property
    def riot_id(self) -> str:
        return f"{self.game_name}#{self.tag_line}"
