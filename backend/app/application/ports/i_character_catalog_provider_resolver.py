from abc import ABC, abstractmethod
from typing import TYPE_CHECKING, Optional

if TYPE_CHECKING:
    from app.application.ports.i_character_catalog_provider import ICharacterCatalogProvider
    from app.domain.models.videogame import Videogame


class ICharacterCatalogProviderResolver(ABC):

    @abstractmethod
    def get_provider_for(self, videogame: 'Videogame') -> Optional['ICharacterCatalogProvider']:
        """Devuelve la fuente externa del videojuego, o None si sus personajes se cargan manualmente."""
        raise NotImplementedError
