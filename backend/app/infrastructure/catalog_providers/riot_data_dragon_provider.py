import io
from pathlib import PurePosixPath
from typing import BinaryIO
from urllib.parse import urlparse

import httpx

from app.application.ports.i_character_catalog_provider import ICharacterCatalogProvider
from app.domain.exceptions.character.external_catalog_unavailable_exception import ExternalCatalogUnavailableException
from app.domain.models.catalog_character import CatalogCharacter
from app.infrastructure.config.settings import settings


class RiotDataDragonProvider(ICharacterCatalogProvider):
    """
    Campeones de League of Legends desde Data Dragon, la API oficial y pública de Riot Games.
    Doc: https://developer.riotgames.com/docs/lol#data-dragon
    """

    def __init__(self, http_client: httpx.Client, base_url: str | None = None, locale: str | None = None):
        self.http_client: httpx.Client = http_client
        raw_base_url = base_url if base_url is not None else settings.riot_ddragon_base_url
        self.base_url: str = raw_base_url.rstrip("/")
        self.locale: str = locale if locale is not None else settings.riot_ddragon_locale

    @property
    def source_name(self) -> str:
        return "Riot Games (Data Dragon)"

    def fetch_characters(self) -> list[CatalogCharacter]:
        # 1. La primera versión de la lista es la del parche actual
        versions = self._get_json(f"{self.base_url}/api/versions.json")
        if not isinstance(versions, list) or not versions:
            raise ExternalCatalogUnavailableException(self.source_name)
        latest_version = versions[0]

        # 2. Campeones de ese parche, con los nombres traducidos al idioma configurado
        champions = self._get_json(f"{self.base_url}/cdn/{latest_version}/data/{self.locale}/champion.json")

        try:
            return [
                CatalogCharacter(
                    name=champion["name"],
                    icon_source=f"{self.base_url}/cdn/{latest_version}/img/champion/{champion['image']['full']}"
                )
                for champion in champions["data"].values()
            ]
        except (KeyError, TypeError, AttributeError):
            raise ExternalCatalogUnavailableException(self.source_name)

    def download_icon(self, character: CatalogCharacter) -> tuple[BinaryIO, str]:
        try:
            response = self.http_client.get(character.icon_source)
            response.raise_for_status()
        except httpx.HTTPError:
            raise ExternalCatalogUnavailableException(self.source_name)

        # Se nombra el archivo con el nombre visible ("Wukong.png") y no con el id interno de Riot ("MonkeyKing.png")
        extension = PurePosixPath(urlparse(character.icon_source).path).suffix or ".png"
        return io.BytesIO(response.content), f"{character.name}{extension}"

    def _get_json(self, url: str):
        try:
            response = self.http_client.get(url)
            response.raise_for_status()
            return response.json()
        except (httpx.HTTPError, ValueError):
            raise ExternalCatalogUnavailableException(self.source_name)
