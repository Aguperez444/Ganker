from abc import ABC, abstractmethod
from typing import TYPE_CHECKING, Optional

if TYPE_CHECKING:
    from app.domain.models.discord_account_link import DiscordAccountLink


class IDiscordAccountLinkRepository(ABC):

    @abstractmethod
    def get_by_user_id(self, user_id: int) -> Optional['DiscordAccountLink']:
        raise NotImplementedError

    @abstractmethod
    def get_by_discord_user_id(self, discord_user_id: str) -> Optional['DiscordAccountLink']:
        raise NotImplementedError

    @abstractmethod
    def save(self, link: 'DiscordAccountLink') -> 'DiscordAccountLink':
        """Crea la vinculación si es nueva o actualiza su visibilidad si ya existe."""
        raise NotImplementedError

    @abstractmethod
    def delete_by_user_id(self, user_id: int) -> bool:
        raise NotImplementedError
