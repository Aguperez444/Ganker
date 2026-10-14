from urllib.parse import urlencode

import httpx

from app.application.ports.i_discord_oauth_provider import IDiscordOAuthProvider
from app.domain.exceptions.discord.discord_api_unavailable_exception import DiscordApiUnavailableException
from app.domain.exceptions.discord.discord_authorization_failed_exception import DiscordAuthorizationFailedException
from app.domain.exceptions.discord.discord_not_configured_exception import DiscordNotConfiguredException
from app.domain.models.discord_account_link import DiscordAccount
from app.infrastructure.config.settings import settings

discord_http_client = httpx.Client(timeout=settings.external_catalog_timeout_seconds)

DISCORD_AUTHORIZE_URL = "https://discord.com/oauth2/authorize"
DISCORD_API_URL = "https://discord.com/api/v10"
DISCORD_CDN_URL = "https://cdn.discordapp.com"


class DiscordOAuthProvider(IDiscordOAuthProvider):
    """
    "Conectar con Discord" con OAuth2 (authorization code). Solo pide el scope `identify`: usuario, nombre y avatar.
    Doc: https://discord.com/developers/docs/topics/oauth2
    El token de acceso se usa una sola vez para leer la cuenta y se revoca: Ganker no lo guarda.
    """

    def __init__(self, http_client: httpx.Client, client_id: str | None = None, client_secret: str | None = None,
                 redirect_uri: str | None = None, api_url: str = DISCORD_API_URL):
        self.http_client: httpx.Client = http_client
        self.client_id: str = client_id if client_id is not None else settings.discord_client_id
        self.client_secret: str = client_secret if client_secret is not None else settings.discord_client_secret
        self.redirect_uri: str = redirect_uri or settings.discord_redirect_uri
        self.api_url: str = api_url

    def authorization_url(self, state: str) -> str:
        self._ensure_configured()
        query = urlencode({
            "response_type": "code",
            "client_id": self.client_id,
            "scope": "identify",
            "redirect_uri": self.redirect_uri,
            "state": state,
            "prompt": "consent",
        })
        return f"{DISCORD_AUTHORIZE_URL}?{query}"

    def exchange_code(self, code: str) -> DiscordAccount:
        self._ensure_configured()

        token_response = self._request("POST", "/oauth2/token", data={
            "grant_type": "authorization_code",
            "code": code,
            "redirect_uri": self.redirect_uri,
        }, auth=(self.client_id, self.client_secret))
        if token_response.status_code in (400, 401):
            raise DiscordAuthorizationFailedException()
        access_token = self._json(token_response).get("access_token")
        if not access_token:
            raise DiscordAuthorizationFailedException()

        try:
            user_response = self._request("GET", "/users/@me", headers={"Authorization": f"Bearer {access_token}"})
            user = self._json(user_response)
        finally:
            self._revoke(access_token)

        try:
            return DiscordAccount(
                discord_user_id=str(user["id"]),
                username=user["username"],
                global_name=user.get("global_name"),
                avatar_url=self._avatar_url(user),
            )
        except (KeyError, TypeError):
            raise DiscordApiUnavailableException()

    # ---------------------------------------------------------

    def _ensure_configured(self) -> None:
        if not self.client_id or not self.client_secret:
            raise DiscordNotConfiguredException()

    def _request(self, method: str, path: str, **kwargs) -> httpx.Response:
        try:
            return self.http_client.request(method, f"{self.api_url}{path}", **kwargs)
        except httpx.HTTPError:
            raise DiscordApiUnavailableException()

    @staticmethod
    def _json(response: httpx.Response) -> dict:
        if response.is_error:
            raise DiscordApiUnavailableException()
        try:
            data = response.json()
        except ValueError:
            raise DiscordApiUnavailableException()
        if not isinstance(data, dict):
            raise DiscordApiUnavailableException()
        return data

    def _revoke(self, access_token: str) -> None:
        # Si falla la revocación no se interrumpe la vinculación: el token vence solo
        try:
            self.http_client.post(f"{self.api_url}/oauth2/token/revoke",
                                  data={"token": access_token, "token_type_hint": "access_token"},
                                  auth=(self.client_id, self.client_secret))
        except httpx.HTTPError:
            pass

    @staticmethod
    def _avatar_url(user: dict) -> str:
        if user.get("avatar"):
            return f"{DISCORD_CDN_URL}/avatars/{user['id']}/{user['avatar']}.png"
        # Avatar por defecto de Discord (usuarios con el nuevo sistema de nombres)
        return f"{DISCORD_CDN_URL}/embed/avatars/{(int(user['id']) >> 22) % 6}.png"
