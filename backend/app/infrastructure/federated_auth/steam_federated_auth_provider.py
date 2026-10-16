import re
from typing import Mapping, Optional
from urllib.parse import urlencode

import httpx

from app.application.ports.i_federated_auth_provider import IFederatedAuthProvider
from app.domain.exceptions.federated_auth.federated_api_unavailable_exception import FederatedApiUnavailableException
from app.domain.exceptions.federated_auth.federated_authorization_failed_exception import (
    FederatedAuthorizationFailedException,
)
from app.domain.exceptions.federated_auth.federated_provider_not_configured_exception import (
    FederatedProviderNotConfiguredException,
)
from app.domain.models.federated_identity import FederatedAccount, FederatedProvider
from app.infrastructure.config.settings import settings

STEAM_OPENID_URL = "https://steamcommunity.com/openid/login"
STEAM_PLAYER_SUMMARIES_URL = "https://api.steampowered.com/ISteamUser/GetPlayerSummaries/v0002/"
STEAM_CLAIMED_ID_REGEX = re.compile(r"^https?://steamcommunity\.com/openid/id/(\d+)$")


class SteamFederatedAuthProvider(IFederatedAuthProvider):
    """
    Inicio de sesión y registro con Steam mediante OpenID 2.0 y lectura de perfil con Steam Web API.
    Steam no expone correo electrónico por OpenID.
    """

    def __init__(self, http_client: httpx.Client, api_key: str | None = None,
                 redirect_uri: str | None = None, realm: str | None = None,
                 openid_url: str = STEAM_OPENID_URL, summaries_url: str = STEAM_PLAYER_SUMMARIES_URL):
        self.http_client: httpx.Client = http_client
        self.api_key: str = api_key if api_key is not None else settings.steam_api_key
        self.redirect_uri: str = redirect_uri or settings.steam_redirect_uri
        self.realm: str = realm or settings.steam_realm
        self.openid_url: str = openid_url
        self.summaries_url: str = summaries_url

    @property
    def provider(self) -> FederatedProvider:
        return FederatedProvider.STEAM

    def authorization_url(self, state: str) -> str:
        self._ensure_configured()
        return_to = f"{self.redirect_uri}?{urlencode({'state': state})}"
        query = urlencode({
            "openid.ns": "http://specs.openid.net/auth/2.0",
            "openid.mode": "checkid_setup",
            "openid.return_to": return_to,
            "openid.realm": self.realm,
            "openid.identity": "http://specs.openid.net/auth/2.0/identifier_select",
            "openid.claimed_id": "http://specs.openid.net/auth/2.0/identifier_select",
        })
        return f"{self.openid_url}?{query}"

    def exchange_callback(self, code: Optional[str] = None,
                          openid_params: Optional[Mapping[str, str]] = None) -> FederatedAccount:
        self._ensure_configured()
        if not openid_params:
            raise FederatedAuthorizationFailedException(self.provider.label)

        claimed_id = openid_params.get("openid.claimed_id", "")
        match = STEAM_CLAIMED_ID_REGEX.match(claimed_id)
        if not match:
            raise FederatedAuthorizationFailedException(self.provider.label)
        steam_id = match.group(1)

        verification_data = {
            key: value for key, value in openid_params.items() if key.startswith("openid.")
        }
        verification_data["openid.mode"] = "check_authentication"

        verify_response = self._request("POST", self.openid_url, data=verification_data)
        if verify_response.is_error:
            raise FederatedApiUnavailableException(self.provider.label)
        if "is_valid:true" not in verify_response.text:
            raise FederatedAuthorizationFailedException(self.provider.label)

        summary_response = self._request(
            "GET",
            self.summaries_url,
            params={"key": self.api_key, "steamids": steam_id},
        )
        if summary_response.is_error:
            raise FederatedApiUnavailableException(self.provider.label)

        try:
            players = summary_response.json()["response"]["players"]
            player = players[0] if players else {}
        except (ValueError, KeyError, IndexError, TypeError):
            raise FederatedApiUnavailableException(self.provider.label)

        persona_name = player.get("personaname") or f"steam_{steam_id[-6:]}"
        clean_username = re.sub(r"[^a-zA-Z0-9_.-]", "", persona_name) or f"steam_{steam_id[-6:]}"

        return FederatedAccount(
            provider=FederatedProvider.STEAM,
            provider_user_id=steam_id,
            username=clean_username,
            display_name=persona_name,
            email=None,
            avatar_url=player.get("avatarfull") or player.get("avatarmedium"),
        )

    def _ensure_configured(self) -> None:
        if not self.api_key:
            raise FederatedProviderNotConfiguredException(self.provider.label)

    def _request(self, method: str, url: str, **kwargs) -> httpx.Response:
        try:
            return self.http_client.request(method, url, **kwargs)
        except httpx.HTTPError:
            raise FederatedApiUnavailableException(self.provider.label)
