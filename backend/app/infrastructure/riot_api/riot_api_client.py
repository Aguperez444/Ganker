from typing import Callable

import httpx

from app.domain.exceptions.domain_exception import DomainException
from app.domain.exceptions.riot.riot_api_unavailable_exception import RiotApiUnavailableException
from app.infrastructure.config.settings import settings

# Cliente HTTP compartido (reutiliza las conexiones entre las consultas de una vinculación o actualización)
riot_http_client = httpx.Client(timeout=settings.external_catalog_timeout_seconds, follow_redirects=True)


class RiotApiClient:
    """
    Consultas a la API de Riot Games con la clave del servidor (RIOT_API_KEY), traduciendo sus errores a
    excepciones de dominio. Lo comparten los adaptadores de League of Legends y de Valorant.
    """

    def __init__(self, http_client: httpx.Client, api_key: str | None = None,
                 api_host_template: str = "https://{host}.api.riotgames.com"):
        self.http_client: httpx.Client = http_client
        self.api_key: str = api_key if api_key is not None else settings.riot_api_key
        self.api_host_template: str = api_host_template

    def get(self, host: str, path: str, on_not_found: Callable[[], DomainException] | None = None):
        """
        GET a `https://{host}.api.riotgames.com{path}`. `host` es un servidor (ej. "la2") o una región
        (ej. "americas"). Si Riot responde 404 y se indicó `on_not_found`, lanza esa excepción.
        """
        if not self.api_key:
            raise RiotApiUnavailableException(
                "El servidor no tiene configurada la clave de la API de Riot (RIOT_API_KEY en secrets.local.env).",
                status_code=503
            )

        try:
            response = self.http_client.get(
                self.api_host_template.format(host=host) + path, headers={"X-Riot-Token": self.api_key}
            )
        except httpx.HTTPError:
            raise RiotApiUnavailableException()

        if response.status_code == 404 and on_not_found:
            raise on_not_found()
        if response.status_code in (401, 403):
            raise RiotApiUnavailableException(
                "La clave de la API de Riot no es válida o venció (las de desarrollo duran 24 horas).", status_code=503
            )
        if response.status_code == 429:
            raise RiotApiUnavailableException(
                "Riot está limitando las consultas en este momento. Probá de nuevo en unos minutos.", status_code=503
            )
        if response.is_error:
            raise RiotApiUnavailableException()

        try:
            return response.json()
        except ValueError:
            raise RiotApiUnavailableException()
