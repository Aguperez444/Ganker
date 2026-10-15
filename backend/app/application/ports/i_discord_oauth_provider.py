from abc import ABC, abstractmethod
from typing import TYPE_CHECKING

if TYPE_CHECKING:
    from app.domain.models.discord_account_link import DiscordAccount


class IDiscordOAuthProvider(ABC):
    """Inicio de sesión con Discord (OAuth2) para vincular la cuenta de un jugador."""

    @abstractmethod
    def authorization_url(self, state: str) -> str:
        """URL de Discord a la que se manda al jugador para que autorice a Ganker. Lanza DiscordNotConfiguredException."""
        raise NotImplementedError

    @abstractmethod
    def exchange_code(self, code: str) -> 'DiscordAccount':
        """
        Cambia el código que devuelve Discord por los datos de la cuenta del jugador.
        Lanza DiscordAuthorizationFailedException si el código no sirve y DiscordApiUnavailableException si falla.
        """
        raise NotImplementedError
