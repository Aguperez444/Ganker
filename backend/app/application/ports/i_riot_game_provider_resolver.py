from abc import ABC, abstractmethod
from typing import TYPE_CHECKING, Optional

if TYPE_CHECKING:
    from app.application.ports.i_riot_game_provider import IRiotGameProvider
    from app.domain.models.videogame import Videogame


class IRiotGameProviderResolver(ABC):

    @abstractmethod
    def get_provider_for(self, videogame: 'Videogame') -> Optional['IRiotGameProvider']:
        """Acceso a la API de Riot del videojuego, o None si no es un juego de Riot (no admite vincular cuenta)."""
        raise NotImplementedError
