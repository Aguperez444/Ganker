from abc import ABC, abstractmethod
from typing import TYPE_CHECKING, Optional

if TYPE_CHECKING:
    from app.domain.models.riot_account_link import RiotAccountLink


class IRiotAccountLinkRepository(ABC):

    @abstractmethod
    def get_by_game_profile_id(self, game_profile_id: int) -> Optional['RiotAccountLink']:
        raise NotImplementedError

    @abstractmethod
    def get_by_puuid(self, puuid: str) -> list['RiotAccountLink']:
        """Vinculaciones de una cuenta de Riot (puede estar en el perfil de LoL y en el de Valorant del jugador)."""
        raise NotImplementedError

    @abstractmethod
    def save(self, link: 'RiotAccountLink') -> 'RiotAccountLink':
        """Crea la vinculación si es nueva o actualiza sus estadísticas si ya existe."""
        raise NotImplementedError

    @abstractmethod
    def delete_by_game_profile_id(self, game_profile_id: int) -> bool:
        raise NotImplementedError
