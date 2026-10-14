from dataclasses import dataclass
from datetime import datetime
from enum import Enum
from typing import Optional

from app.domain.exceptions.entity_not_persisted_exception import EntityNotPersistedException


class DiscordVisibility(str, Enum):
    """Quién puede ver la cuenta de Discord de un jugador."""
    EVERYONE = "everyone"     # Cualquier jugador con sesión iniciada
    TEAMMATES = "teammates"   # Solo sus compañeros del equipo activo


@dataclass(frozen=True)
class DiscordAccount:
    """Cuenta de Discord tal como la informa Discord después de que el jugador autoriza a Ganker."""
    discord_user_id: str
    username: str
    global_name: Optional[str]
    avatar_url: Optional[str]

    @property
    def display_name(self) -> str:
        return self.global_name or self.username


class DiscordAccountLink:
    """Cuenta de Discord vinculada al perfil general de un jugador de Ganker."""

    def __init__(self, link_id: Optional[int], user_id: int, account: DiscordAccount,
                 visibility: DiscordVisibility = DiscordVisibility.TEAMMATES, linked_at: Optional[datetime] = None):
        self._link_id: Optional[int] = link_id
        self._user_id: int = user_id
        self._account: DiscordAccount = account
        self._visibility: DiscordVisibility = visibility
        self._linked_at: Optional[datetime] = linked_at

    @property
    def link_id(self) -> int:
        if self._link_id is None:
            raise EntityNotPersistedException("DiscordAccountLink")
        return self._link_id

    @property
    def user_id(self) -> int:
        return self._user_id

    @property
    def account(self) -> DiscordAccount:
        return self._account

    @property
    def visibility(self) -> DiscordVisibility:
        return self._visibility
    @visibility.setter
    def visibility(self, value: DiscordVisibility) -> None:
        self._visibility = value

    @property
    def linked_at(self) -> Optional[datetime]:
        return self._linked_at

    def is_persisted(self) -> bool:
        return self._link_id is not None

    def __repr__(self) -> str:
        return (f"DiscordAccountLink(link_id={self._link_id or 'sin_id'}, user_id={self.user_id},"
                f" username='{self.account.username}', visibility={self.visibility.value})")
