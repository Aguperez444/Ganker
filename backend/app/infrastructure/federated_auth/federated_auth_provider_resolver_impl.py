from typing import Mapping

import httpx

from app.application.ports.i_federated_auth_provider import IFederatedAuthProvider, IFederatedAuthProviderResolver
from app.domain.exceptions.federated_auth.unsupported_federated_provider_exception import (
    UnsupportedFederatedProviderException,
)
from app.domain.models.federated_identity import FederatedProvider
from app.infrastructure.config.settings import settings
from app.infrastructure.federated_auth.discord_federated_auth_provider import DiscordFederatedAuthProvider
from app.infrastructure.federated_auth.google_federated_auth_provider import GoogleFederatedAuthProvider
from app.infrastructure.federated_auth.steam_federated_auth_provider import SteamFederatedAuthProvider
from app.infrastructure.federated_auth.twitch_federated_auth_provider import TwitchFederatedAuthProvider

federated_http_client = httpx.Client(timeout=settings.external_catalog_timeout_seconds)


class FederatedAuthProviderResolverImpl(IFederatedAuthProviderResolver):

    def __init__(self, providers: Mapping[FederatedProvider, IFederatedAuthProvider] | None = None):
        if providers is not None:
            self._providers: dict[FederatedProvider, IFederatedAuthProvider] = dict(providers)
        else:
            self._providers = {
                FederatedProvider.DISCORD: DiscordFederatedAuthProvider(federated_http_client),
                FederatedProvider.GOOGLE: GoogleFederatedAuthProvider(federated_http_client),
                FederatedProvider.TWITCH: TwitchFederatedAuthProvider(federated_http_client),
                FederatedProvider.STEAM: SteamFederatedAuthProvider(federated_http_client),
            }

    def resolve(self, provider_name: str) -> IFederatedAuthProvider:
        normalized = (provider_name or "").strip().lower()
        try:
            provider_enum = FederatedProvider(normalized)
        except ValueError:
            raise UnsupportedFederatedProviderException(provider_name)

        adapter = self._providers.get(provider_enum)
        if adapter is None:
            raise UnsupportedFederatedProviderException(provider_name)
        return adapter
