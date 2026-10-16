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

TWITCH_AUTHORIZE_URL = "https://id.twitch.tv/oauth2/authorize"
TWITCH_TOKEN_URL = "https://id.twitch.tv/oauth2/token"
TWITCH_USERS_URL = "https://api.twitch.tv/helix/users"


class TwitchFederatedAuthProvider(IFederatedAuthProvider):
    """
    Inicio de sesión y registro con Twitch (OAuth2 authorization code).
    Pide el scope `user:read:email`.
    """

    def __init__(self, http_client: httpx.Client, client_id: str | None = None, client_secret: str | None = None,
                 redirect_uri: str | None = None, token_url: str = TWITCH_TOKEN_URL,
                 users_url: str = TWITCH_USERS_URL):
        self.http_client: httpx.Client = http_client
        self.client_id: str = client_id if client_id is not None else settings.twitch_client_id
        self.client_secret: str = client_secret if client_secret is not None else settings.twitch_client_secret
        self.redirect_uri: str = redirect_uri or settings.twitch_redirect_uri
        self.token_url: str = token_url
        self.users_url: str = users_url

    @property
    def provider(self) -> FederatedProvider:
        return FederatedProvider.TWITCH

    def authorization_url(self, state: str) -> str:
        self._ensure_configured()
        query = urlencode({
            "response_type": "code",
            "client_id": self.client_id,
            "scope": "user:read:email",
            "redirect_uri": self.redirect_uri,
            "state": state,
            "force_verify": "true",
        })
        return f"{TWITCH_AUTHORIZE_URL}?{query}"

    def exchange_callback(self, code: Optional[str] = None,
                          openid_params: Optional[Mapping[str, str]] = None) -> FederatedAccount:
        self._ensure_configured()
        if not code:
            raise FederatedAuthorizationFailedException(self.provider.label)

        token_response = self._request("POST", self.token_url, data={
            "grant_type": "authorization_code",
            "code": code,
            "client_id": self.client_id,
            "client_secret": self.client_secret,
            "redirect_uri": self.redirect_uri,
        })
        if token_response.status_code in (400, 401):
            raise FederatedAuthorizationFailedException(self.provider.label)
        access_token = self._json(token_response).get("access_token")
        if not access_token:
            raise FederatedAuthorizationFailedException(self.provider.label)

        user_response = self._request(
            "GET",
            self.users_url,
            headers={
                "Authorization": f"Bearer {access_token}",
                "Client-Id": self.client_id,
            },
        )
        payload = self._json(user_response)

        try:
            users_list = payload["data"]
            if not isinstance(users_list, list) or not users_list:
                raise FederatedApiUnavailableException(self.provider.label)
            user = users_list[0]
            return FederatedAccount(
                provider=FederatedProvider.TWITCH,
                provider_user_id=str(user["id"]),
                username=str(user["login"]),
                display_name=user.get("display_name") or str(user["login"]),
                email=user.get("email"),
                avatar_url=user.get("profile_image_url"),
            )
        except (KeyError, TypeError, ValueError):
            raise FederatedApiUnavailableException(self.provider.label)

    def _ensure_configured(self) -> None:
        if not self.client_id or not self.client_secret:
            raise FederatedProviderNotConfiguredException(self.provider.label)

    def _request(self, method: str, url: str, **kwargs) -> httpx.Response:
        try:
            return self.http_client.request(method, url, **kwargs)
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
