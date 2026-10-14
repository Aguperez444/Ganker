from datetime import datetime, timedelta, timezone
from urllib.parse import parse_qs, urlparse

import httpx
import jwt
import pytest

from app.domain.exceptions.discord.discord_api_unavailable_exception import DiscordApiUnavailableException
from app.domain.exceptions.discord.discord_authorization_failed_exception import DiscordAuthorizationFailedException
from app.domain.exceptions.discord.discord_not_configured_exception import DiscordNotConfiguredException
from app.domain.exceptions.discord.invalid_oauth_state_exception import InvalidOAuthStateException
from app.infrastructure.api.auth.jwt_oauth_state_service import JwtOAuthStateService
from app.infrastructure.discord_api.discord_oauth_provider import DiscordOAuthProvider

REDIRECT = "http://localhost:5173/app/discord/callback"
DISCORD_USER = {"id": "80351110224678912", "username": "ana_gamer", "global_name": "Ana", "avatar": "8342729096ea3675442027381ff50dfe"}


class FakeDiscord:
    """Simula los endpoints de Discord que usa el adaptador y guarda lo que recibió."""

    def __init__(self, token_status=200, user=DISCORD_USER, user_status=200):
        self.token_status = token_status
        self.user = user
        self.user_status = user_status
        self.requests: list[httpx.Request] = []

    def __call__(self, request: httpx.Request) -> httpx.Response:
        self.requests.append(request)
        if request.url.path.endswith("/oauth2/token"):
            if self.token_status != 200:
                return httpx.Response(self.token_status, json={"error": "invalid_grant"})
            return httpx.Response(200, json={"access_token": "token-de-prueba", "token_type": "Bearer"})
        if request.url.path.endswith("/users/@me"):
            assert request.headers["Authorization"] == "Bearer token-de-prueba"
            return httpx.Response(self.user_status, json=self.user)
        if request.url.path.endswith("/oauth2/token/revoke"):
            return httpx.Response(200)
        return httpx.Response(404)

    def paths(self):
        return [r.url.path for r in self.requests]


def _provider(fake=None, client_id="cliente", client_secret="secreto") -> DiscordOAuthProvider:
    client = httpx.Client(transport=httpx.MockTransport(fake or FakeDiscord()))
    return DiscordOAuthProvider(client, client_id=client_id, client_secret=client_secret, redirect_uri=REDIRECT,
                                api_url="https://discord.test/api")


class TestDiscordOAuthProvider:

    def test_authorization_url(self):
        url = urlparse(_provider().authorization_url("mi-state"))
        query = parse_qs(url.query)

        assert f"{url.scheme}://{url.netloc}{url.path}" == "https://discord.com/oauth2/authorize"
        assert query["client_id"] == ["cliente"]
        assert query["scope"] == ["identify"]
        assert query["redirect_uri"] == [REDIRECT]
        assert query["state"] == ["mi-state"]
        assert query["response_type"] == ["code"]

    def test_exchange_code_reads_account_and_revokes_token(self):
        fake = FakeDiscord()

        account = _provider(fake).exchange_code("codigo")

        assert account.discord_user_id == "80351110224678912"
        assert account.username == "ana_gamer"
        assert account.display_name == "Ana"
        assert account.avatar_url == ("https://cdn.discordapp.com/avatars/80351110224678912/"
                                      "8342729096ea3675442027381ff50dfe.png")
        assert fake.paths() == ["/api/oauth2/token", "/api/users/@me", "/api/oauth2/token/revoke"]
        token_request = fake.requests[0]
        assert b"grant_type=authorization_code" in token_request.content
        assert b"code=codigo" in token_request.content
        assert token_request.headers["Authorization"].startswith("Basic ")

    def test_user_without_avatar_gets_default_one(self):
        account = _provider(FakeDiscord(user={**DISCORD_USER, "avatar": None})).exchange_code("codigo")
        assert account.avatar_url.startswith("https://cdn.discordapp.com/embed/avatars/")

    def test_invalid_code(self):
        with pytest.raises(DiscordAuthorizationFailedException) as exc_info:
            _provider(FakeDiscord(token_status=400)).exchange_code("vencido")
        assert exc_info.value.status_code == 400

    def test_discord_down(self):
        with pytest.raises(DiscordApiUnavailableException):
            _provider(FakeDiscord(user_status=500)).exchange_code("codigo")

    def test_network_error(self):
        def handler(request):
            raise httpx.ConnectError("sin conexión", request=request)
        with pytest.raises(DiscordApiUnavailableException):
            _provider(handler).exchange_code("codigo")

    def test_not_configured(self):
        with pytest.raises(DiscordNotConfiguredException) as exc_info:
            _provider(client_id="", client_secret="").authorization_url("state")
        assert exc_info.value.status_code == 503


class TestJwtOAuthStateService:

    def test_state_is_valid_for_the_same_user(self):
        service = JwtOAuthStateService("secreto-de-prueba-suficientemente-largo")
        service.validate_state(service.create_state(7), 7)

    def test_state_of_another_user_is_rejected(self):
        service = JwtOAuthStateService("secreto-de-prueba-suficientemente-largo")
        with pytest.raises(InvalidOAuthStateException):
            service.validate_state(service.create_state(7), 8)

    def test_expired_state_is_rejected(self):
        service = JwtOAuthStateService("secreto-de-prueba-suficientemente-largo", expiration_minutes=-1)
        with pytest.raises(InvalidOAuthStateException):
            service.validate_state(service.create_state(7), 7)

    def test_tampered_or_foreign_tokens_are_rejected(self):
        service = JwtOAuthStateService("secreto-de-prueba-suficientemente-largo")
        signed_elsewhere = JwtOAuthStateService("otro-secreto-de-prueba-bastante-largo").create_state(7)
        # Un token de sesión (u otro JWT firmado con la misma clave) no sirve como state
        other_purpose = jwt.encode({"sub": "7", "exp": datetime.now(timezone.utc) + timedelta(minutes=5)},
                                   "secreto-de-prueba-suficientemente-largo", algorithm="HS256")
        for state in (signed_elsewhere, other_purpose, "basura"):
            with pytest.raises(InvalidOAuthStateException):
                service.validate_state(state, 7)
