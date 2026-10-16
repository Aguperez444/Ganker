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

GOOGLE_AUTHORIZE_URL = "https://accounts.google.com/o/oauth2/v2/auth"
GOOGLE_TOKEN_URL = "https://oauth2.googleapis.com/token"
GOOGLE_USERINFO_URL = "https://www.googleapis.com/oauth2/v3/userinfo"


class GoogleFederatedAuthProvider(IFederatedAuthProvider):
    """
    Inicio de sesión y registro con Google (OAuth2 / OpenID Connect).
    Pide los scopes `openid email profile`.
    """

    def __init__(self, http_client: httpx.Client, client_id: str | None = None, client_secret: str | None = None,
                 redirect_uri: str | None = None, token_url: str = GOOGLE_TOKEN_URL,
                 userinfo_url: str = GOOGLE_USERINFO_URL):
        self.http_client: httpx.Client = http_client
        self.client_id: str = client_id if client_id is not None else settings.google_client_id
        self.client_secret: str = client_secret if client_secret is not None else settings.google_client_secret
        self.redirect_uri: str = redirect_uri or settings.google_redirect_uri
        self.token_url: str = token_url
        self.userinfo_url: str = userinfo_url

    @property
    def provider(self) -> FederatedProvider:
        return FederatedProvider.GOOGLE

    def authorization_url(self, state: str) -> str:
        self._ensure_configured()
        query = urlencode({
            "response_type": "code",
            "client_id": self.client_id,
            "scope": "openid email profile",
            "redirect_uri": self.redirect_uri,
            "state": state,
            "prompt": "select_account",
        })
        return f"{GOOGLE_AUTHORIZE_URL}?{query}"

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
            self.userinfo_url,
            headers={"Authorization": f"Bearer {access_token}"},
        )
        user = self._json(user_response)

        try:
            sub = str(user["sub"])
            email = user.get("email") if user.get("email_verified", True) else None
            display_name = user.get("name") or user.get("given_name") or (email.split("@")[0] if email else f"jugador_{sub[-6:]}")
            raw_username = email.split("@")[0] if email else display_name
            username = re.sub(r"[^a-zA-Z0-9_.-]", "", raw_username) or f"jugador_{sub[-6:]}"

            return FederatedAccount(
                provider=FederatedProvider.GOOGLE,
                provider_user_id=sub,
                username=username,
                display_name=display_name,
                email=email,
                avatar_url=user.get("picture"),
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
