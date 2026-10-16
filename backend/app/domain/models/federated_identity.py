from dataclasses import dataclass
from datetime import datetime
from enum import Enum
from typing import Optional

from app.domain.exceptions.entity_not_persisted_exception import EntityNotPersistedException


class FederatedProvider(str, Enum):
    """Proveedores de identidad federada soportados para iniciar sesión o registrarse en Ganker."""
    DISCORD = "discord"
    STEAM = "steam"
    TWITCH = "twitch"
    GOOGLE = "google"

    @property
    def label(self) -> str:
        labels = {
            FederatedProvider.DISCORD: "Discord",
            FederatedProvider.STEAM: "Steam",
            FederatedProvider.TWITCH: "Twitch",
            FederatedProvider.GOOGLE: "Google",
        }
        return labels[self]


@dataclass(frozen=True)
class FederatedAccount:
    """Datos verificados de la cuenta externa que informa el proveedor de identidad federada."""
    provider: FederatedProvider
    provider_user_id: str
    username: str
    display_name: Optional[str]
    email: Optional[str]
    avatar_url: Optional[str]

    @property
    def suggested_name(self) -> str:
        return self.display_name or self.username


class FederatedIdentity:
    """Identidad federada asociada a un usuario de Ganker para iniciar sesión."""

    def __init__(self, identity_id: Optional[int], user_id: int, provider: FederatedProvider,
                 provider_user_id: str, email: Optional[str] = None, linked_at: Optional[datetime] = None):
        self._identity_id: Optional[int] = identity_id
        self._user_id: int = user_id
        self._provider: FederatedProvider = provider
        self._provider_user_id: str = provider_user_id
        self._email: Optional[str] = email
        self._linked_at: Optional[datetime] = linked_at

    @property
    def identity_id(self) -> int:
        if self._identity_id is None:
            raise EntityNotPersistedException("FederatedIdentity")
        return self._identity_id

    @property
    def user_id(self) -> int:
        return self._user_id

    @property
    def provider(self) -> FederatedProvider:
        return self._provider

    @property
    def provider_user_id(self) -> str:
        return self._provider_user_id

    @property
    def email(self) -> Optional[str]:
        return self._email

    @property
    def linked_at(self) -> Optional[datetime]:
        return self._linked_at

    def is_persisted(self) -> bool:
        return self._identity_id is not None

    def __repr__(self) -> str:
        return (f"FederatedIdentity(identity_id={self._identity_id or 'sin_id'}, user_id={self.user_id},"
                f" provider={self.provider.value}, provider_user_id='{self.provider_user_id}')")
