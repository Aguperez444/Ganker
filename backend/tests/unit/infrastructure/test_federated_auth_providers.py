from datetime import datetime, timedelta, timezone
from urllib.parse import parse_qs, urlparse

import httpx
import jwt
import pytest

from app.domain.exceptions.federated_auth.federated_api_unavailable_exception import FederatedApiUnavailableException
from app.domain.exceptions.federated_auth.federated_authorization_failed_exception import (
    FederatedAuthorizationFailedException,
)
from app.domain.exceptions.federated_auth.federated_provider_not_configured_exception import (
    FederatedProviderNotConfiguredException,
)
from app.domain.exceptions.federated_auth.invalid_federated_registration_token_exception import (
    InvalidFederatedRegistrationTokenException,
)
from app.domain.exceptions.federated_auth.invalid_federated_state_exception import InvalidFederatedStateException
from app.domain.exceptions.federated_auth.unsupported_federated_provider_exception import (
    UnsupportedFederatedProviderException,
)
from app.domain.models.federated_identity import FederatedAccount, FederatedProvider
from app.infrastructure.api.auth.jwt_federated_state_service import JwtFederatedStateService
from app.infrastructure.federated_auth.discord_federated_auth_provider import DiscordFederatedAuthProvider
from app.infrastructure.federated_auth.federated_auth_provider_resolver_impl import FederatedAuthProviderResolverImpl
from app.infrastructure.federated_auth.google_federated_auth_provider import GoogleFederatedAuthProvider
from app.infrastructure.federated_auth.steam_federated_auth_provider import SteamFederatedAuthProvider
from app.infrastructure.federated_auth.twitch_federated_auth_provider import TwitchFederatedAuthProvider

SECRET = "secreto-federado-de-prueba-suficientemente-largo-123"


class TestJwtFederatedStateService:

    def test_state_is_valid_for_expected_provider(self):
        service = JwtFederatedStateService(SECRET)
        state = service.create_state(FederatedProvider.DISCORD)
        service.validate_state(state, FederatedProvider.DISCORD)

    def test_state_for_different_provider_is_rejected(self):
        service = JwtFederatedStateService(SECRET)
        state = service.create_state(FederatedProvider.DISCORD)
        with pytest.raises(InvalidFederatedStateException):
            service.validate_state(state, FederatedProvider.GOOGLE)

    def test_expired_state_is_rejected(self):
        service = JwtFederatedStateService(SECRET, state_expiration_minutes=-1)
        state = service.create_state(FederatedProvider.TWITCH)
        with pytest.raises(InvalidFederatedStateException):
            service.validate_state(state, FederatedProvider.TWITCH)

    def test_registration_token_roundtrip(self):
        service = JwtFederatedStateService(SECRET)
        account = FederatedAccount(
            provider=FederatedProvider.STEAM,
            provider_user_id="76561198000000001",
            username="ana_steam",
            display_name="Ana Steam",
            email=None,
            avatar_url="https://avatars.steamstatic.com/ana.jpg",
        )
        token = service.create_registration_token(account)
        decoded = service.decode_registration_token(token)
        assert decoded == account

    def test_invalid_or_expired_registration_token_is_rejected(self):
        service = JwtFederatedStateService(SECRET, registration_expiration_minutes=-1)
        account = FederatedAccount(
            provider=FederatedProvider.GOOGLE,
            provider_user_id="google-123",
            username="ana",
            display_name="Ana",
            email="ana@example.com",
            avatar_url=None,
        )
        expired_token = service.create_registration_token(account)
        other_purpose = jwt.encode(
            {"purpose": "other", "exp": datetime.now(timezone.utc) + timedelta(minutes=5)},
            SECRET,
            algorithm="HS256",
        )
        for bad in (expired_token, other_purpose, "basura"):
            with pytest.raises(InvalidFederatedRegistrationTokenException):
                service.decode_registration_token(bad)


class TestDiscordFederatedAuthProvider:

    def test_authorization_url_and_exchange(self):
        def handler(request: httpx.Request) -> httpx.Response:
            if request.url.path.endswith("/oauth2/token"):
                return httpx.Response(200, json={"access_token": "tok-discord"})
            if request.url.path.endswith("/users/@me"):
                return httpx.Response(200, json={
                    "id": "80351110224678912",
                    "username": "ana_discord",
                    "global_name": "Ana Discord",
                    "email": "ana@discord.test",
                    "verified": True,
                    "avatar": "hash123",
                })
            if request.url.path.endswith("/oauth2/token/revoke"):
                return httpx.Response(200)
            return httpx.Response(404)

        client = httpx.Client(transport=httpx.MockTransport(handler))
        provider = DiscordFederatedAuthProvider(
            client, client_id="id", client_secret="sec",
            redirect_uri="http://localhost:5173/auth/callback/discord",
            api_url="https://discord.test/api",
        )

        url = urlparse(provider.authorization_url("st-1"))
        assert parse_qs(url.query)["scope"] == ["identify email"]

        account = provider.exchange_callback(code="ok")
        assert account.provider == FederatedProvider.DISCORD
        assert account.provider_user_id == "80351110224678912"
        assert account.username == "ana_discord"
        assert account.display_name == "Ana Discord"
        assert account.email == "ana@discord.test"
        assert account.avatar_url.endswith("/hash123.png")


class TestGoogleFederatedAuthProvider:

    def test_authorization_url_and_exchange(self):
        def handler(request: httpx.Request) -> httpx.Response:
            if str(request.url) == "https://google.test/token":
                return httpx.Response(200, json={"access_token": "tok-google"})
            if str(request.url) == "https://google.test/userinfo":
                return httpx.Response(200, json={
                    "sub": "google-sub-999",
                    "name": "Ana Google",
                    "email": "ana.google@example.com",
                    "email_verified": True,
                    "picture": "https://lh3.googleusercontent.com/a/ana",
                })
            return httpx.Response(404)

        client = httpx.Client(transport=httpx.MockTransport(handler))
        provider = GoogleFederatedAuthProvider(
            client, client_id="gid", client_secret="gsec",
            redirect_uri="http://localhost:5173/auth/callback/google",
            token_url="https://google.test/token",
            userinfo_url="https://google.test/userinfo",
        )

        url = urlparse(provider.authorization_url("st-g"))
        assert parse_qs(url.query)["scope"] == ["openid email profile"]

        account = provider.exchange_callback(code="code-g")
        assert account.provider == FederatedProvider.GOOGLE
        assert account.provider_user_id == "google-sub-999"
        assert account.username == "ana.google"
        assert account.display_name == "Ana Google"
        assert account.email == "ana.google@example.com"
        assert account.avatar_url == "https://lh3.googleusercontent.com/a/ana"


class TestTwitchFederatedAuthProvider:

    def test_authorization_url_and_exchange(self):
        def handler(request: httpx.Request) -> httpx.Response:
            if str(request.url) == "https://twitch.test/token":
                return httpx.Response(200, json={"access_token": "tok-twitch"})
            if str(request.url) == "https://twitch.test/users":
                assert request.headers["Client-Id"] == "tid"
                return httpx.Response(200, json={
                    "data": [{
                        "id": "445566",
                        "login": "ana_twitch",
                        "display_name": "AnaTwitch",
                        "email": "ana@twitch.test",
                        "profile_image_url": "https://static-cdn.jtvnw.net/ana.png",
                    }]
                })
            return httpx.Response(404)

        client = httpx.Client(transport=httpx.MockTransport(handler))
        provider = TwitchFederatedAuthProvider(
            client, client_id="tid", client_secret="tsec",
            redirect_uri="http://localhost:5173/auth/callback/twitch",
            token_url="https://twitch.test/token",
            users_url="https://twitch.test/users",
        )

        url = urlparse(provider.authorization_url("st-t"))
        assert parse_qs(url.query)["scope"] == ["user:read:email"]

        account = provider.exchange_callback(code="code-t")
        assert account.provider == FederatedProvider.TWITCH
        assert account.provider_user_id == "445566"
        assert account.username == "ana_twitch"
        assert account.display_name == "AnaTwitch"
        assert account.email == "ana@twitch.test"


class TestSteamFederatedAuthProvider:

    def test_authorization_url_and_exchange(self):
        def handler(request: httpx.Request) -> httpx.Response:
            if str(request.url).startswith("https://steam.test/openid"):
                return httpx.Response(200, text="ns:http://specs.openid.net/auth/2.0\nis_valid:true\n")
            if str(request.url).startswith("https://steam.test/summaries"):
                return httpx.Response(200, json={
                    "response": {
                        "players": [{
                            "steamid": "76561198012345678",
                            "personaname": "Ana Steam!",
                            "avatarfull": "https://avatars.steamstatic.com/ana_full.jpg",
                        }]
                    }
                })
            return httpx.Response(404)

        client = httpx.Client(transport=httpx.MockTransport(handler))
        provider = SteamFederatedAuthProvider(
            client, api_key="steam-key",
            redirect_uri="http://localhost:5173/auth/callback/steam",
            realm="http://localhost:5173",
            openid_url="https://steam.test/openid",
            summaries_url="https://steam.test/summaries",
        )

        url = urlparse(provider.authorization_url("st-s"))
        query = parse_qs(url.query)
        assert query["openid.mode"] == ["checkid_setup"]
        assert "state=st-s" in query["openid.return_to"][0]

        account = provider.exchange_callback(openid_params={
            "openid.ns": "http://specs.openid.net/auth/2.0",
            "openid.mode": "id_res",
            "openid.claimed_id": "https://steamcommunity.com/openid/id/76561198012345678",
            "openid.identity": "https://steamcommunity.com/openid/id/76561198012345678",
            "openid.sig": "firma",
            "openid.signed": "signed",
        })
        assert account.provider == FederatedProvider.STEAM
        assert account.provider_user_id == "76561198012345678"
        assert account.username == "AnaSteam"
        assert account.display_name == "Ana Steam!"
        assert account.email is None
        assert account.avatar_url == "https://avatars.steamstatic.com/ana_full.jpg"

    def test_steam_rejects_invalid_signature(self):
        def handler(request: httpx.Request) -> httpx.Response:
            return httpx.Response(200, text="ns:http://specs.openid.net/auth/2.0\nis_valid:false\n")

        client = httpx.Client(transport=httpx.MockTransport(handler))
        provider = SteamFederatedAuthProvider(
            client, api_key="steam-key",
            openid_url="https://steam.test/openid",
            summaries_url="https://steam.test/summaries",
        )
        with pytest.raises(FederatedAuthorizationFailedException):
            provider.exchange_callback(openid_params={
                "openid.claimed_id": "https://steamcommunity.com/openid/id/76561198012345678",
            })

    def test_not_configured_raises_503(self):
        client = httpx.Client(transport=httpx.MockTransport(lambda r: httpx.Response(200)))
        provider = SteamFederatedAuthProvider(client, api_key="")
        with pytest.raises(FederatedProviderNotConfiguredException) as exc:
            provider.authorization_url("st")
        assert exc.value.status_code == 503


class TestFederatedAuthProviderResolver:

    def test_unsupported_provider_raises_400(self):
        resolver = FederatedAuthProviderResolverImpl({})
        with pytest.raises(UnsupportedFederatedProviderException) as exc:
            resolver.resolve("epicgames")
        assert exc.value.status_code == 400
