from abc import ABC, abstractmethod
from typing import TYPE_CHECKING, BinaryIO

if TYPE_CHECKING:
    from app.infrastructure.api.dto.request.catalog_character import CatalogCharacter


class ICharacterCatalogProvider(ABC):
    """Fuente externa de la que se pueden importar los personajes de un videojuego."""

    @property
    @abstractmethod
    def source_name(self) -> str:
        """Nombre legible de la fuente, para mostrarle al administrador (ej. 'Riot Games')."""
        raise NotImplementedError

    @abstractmethod
    def fetch_characters(self) -> list['CatalogCharacter']:
        """
        Devuelve todos los personajes que publica la fuente.
        Lanza ExternalCatalogUnavailableException si la fuente no responde.
        """
        raise NotImplementedError

    @abstractmethod
    def download_icon(self, character: 'CatalogCharacter') -> tuple[BinaryIO, str]:
        """
        Descarga el ícono del personaje y devuelve (contenido, nombre_de_archivo).
        Lanza ExternalCatalogUnavailableException si no se pudo descargar.
        """
        raise NotImplementedError
