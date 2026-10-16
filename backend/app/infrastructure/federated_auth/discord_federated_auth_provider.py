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

DISCORD_AUTHORIZE_URL = "https://discord.com/oauth2/authorize"
DISCORD_API_URL = "https://discord.com/api/v10"
DISCORD_CDN_URL = "https://cdn.discordapp.com"


class DiscordFederatedAuthProvider(IFederatedAuthProvider):
    """
    Inicio de sesión y registro con Discord (OAuth2 authorization code).
    Pide los scopes `identify email` para obtener usuario, nombre, avatar y correo verificado.
    """

    def __init__(self, http_client: httpx.Client, client_id: str | None = None, client_secret: str | None = None,
                 redirect_uri: str | None = None, api_url: str = DISCORD_API_URL):
        self.http_client: httpx.Client = http_client
        self.client_id: str = client_id if client_id is not None else settings.discord_client_id
        self.client_secret: str = client_secret if client_secret is not None else settings.discord_client_secret
        self.redirect_uri: str = redirect_uri or settings.discord_auth_redirect_uri
        self.api_url: str = api_url

    @property
    def provider(self) -> FederatedProvider:
        return FederatedProvider.DISCORD

    def authorization_url(self, state: str) -> str:
        self._ensure_configured()
        query = urlencode({
            "response_type": "code",
            "client_id": self.client_id,
            "scope": "identify email",
            "redirect_uri": self.redirect_uri,
            "state": state,
            "prompt": "consent",
        })
        return f"{DISCORD_AUTHORIZE_URL}?{query}"

    def exchange_callback(self, code: Optional[str] = None,
                          openid_params: Optional[Mapping[str, str]] = None) -> FederatedAccount:
        self._ensure_configured()
        if not code:
            raise FederatedAuthorizationFailedException(self.provider.label)

        token_response = self._request("POST", "/oauth2/token", data={
            "grant_type": "authorization_code",
            "code": code,
            "redirect_uri": self.redirect_uri,
        }, auth=(self.client_id, self.client_secret))
        if token_response.status_code in (400, 401):
            raise FederatedAuthorizationFailedException(self.provider.label)
        access_token = self._json(token_response).get("access_token")
        if not access_token:
            raise FederatedAuthorizationFailedException(self.provider.label)

        try:
            user_response = self._request("GET", "/users/@me", headers={"Authorization": f"Bearer {access_token}"})
            user = self._json(user_response)
        finally:
            self._revoke(access_token)

        try:
            email = user.get("email") if user.get("verified", True) else None
            return FederatedAccount(
                provider=FederatedProvider.DISCORD,
                provider_user_id=str(user["id"]),
                username=str(user["username"]),
                display_name=user.get("global_name") or str(user["username"]),
                email=email,
                avatar_url=self._avatar_url(user),
            )
        except (KeyError, TypeError, ValueError):
            raise FederatedApiUnavailableException(self.provider.label)

    def _ensure_configured(self) -> None:
        if not self.client_id or not self.client_secret:
            raise FederatedProviderNotConfiguredException(self.provider.label)

    def _request(self, method: str, path: str, **kwargs) -> httpx.Response:
        try:
            return self.http_client.request(method, f"{self.api_url}{path}", **kwargs)
        except httpx.HTTPError:
            raise FederatedApiUnavailableException(self.provider.label)

    def _json(self, response: httpx.Response) -> dict:
        if response.is_error:
            raise FederatedApiUnavailableException(self.provider.label)
        try:
            data = response.json()
        except ValueError:
            raise FederatedApiUnavailableException(self.provider.label)
        if not isinstance(data, dict):
            raise FederatedApiUnavailableException(self.provider.label)
        return data

    def _revoke(self, access_token: str) -> None:
        try:
            self.http_client.post(
                f"{self.api_url}/oauth2/token/revoke",
                data={"token": access_token, "token_type_hint": "access_token"},
                auth=(self.client_id, self.client_secret),
            )
        except httpx.HTTPError:
            pass

    @staticmethod
    def _avatar_url(user: dict) -> str:
        if user.get("avatar"):
            return f"{DISCORD_CDN_URL}/avatars/{user['id']}/{user['avatar']}.png"
        return f"{DISCORD_CDN_URL}/embed/avatars/{(int(user['id']) >> 22) % 6}.png"
