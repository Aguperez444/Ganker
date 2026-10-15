from abc import ABC, abstractmethod
from typing import TYPE_CHECKING, Optional

if TYPE_CHECKING:
    from app.domain.models.lol_stats import LolStats
    from app.domain.models.riot_account import RiotAccount


class IRiotGameProvider(ABC):
    """
    Acceso a la API de Riot Games para un juego puntual (League of Legends o Valorant):
    buscar la cuenta de un jugador y, si Riot lo permite para ese juego, traer sus estadísticas.
    """

    @property
    @abstractmethod
    def requires_server(self) -> bool:
        """True si el jugador tiene que elegir el servidor al vincular (LoL); False si lo informa Riot (Valorant)."""
        raise NotImplementedError

    @property
    @abstractmethod
    def provides_stats(self) -> bool:
        """True si Riot permite leer estadísticas de este juego con la clave del servidor."""
        raise NotImplementedError

    @abstractmethod
    def find_account(self, game_name: str, tag_line: str, server: Optional[str]) -> tuple['RiotAccount', str]:
        """
        Busca la cuenta por su Riot ID y devuelve (cuenta, servidor o región donde juega).
        Lanza RiotAccountNotFoundException si no existe, RiotServerRequiredException si falta el servidor
        y RiotApiUnavailableException si la API no responde.
        """
        raise NotImplementedError

    @abstractmethod
    def fetch_stats(self, account: 'RiotAccount', server: str) -> Optional['LolStats']:
        """Estadísticas de la cuenta, o None si el juego no las ofrece. Lanza RiotApiUnavailableException si falla."""
        raise NotImplementedError
