from abc import ABC, abstractmethod
from typing import Mapping, Optional

from app.domain.models.federated_identity import FederatedAccount, FederatedProvider


class IFederatedAuthProvider(ABC):
    """Proveedor de identidad federada (OAuth2 / OpenID) para iniciar sesión o registrarse en Ganker."""

    @property
    @abstractmethod
    def provider(self) -> FederatedProvider:
        raise NotImplementedError

    @abstractmethod
    def authorization_url(self, state: str) -> str:
        """URL a la que se redirige al usuario para autorizar su identidad con el proveedor externo."""
        raise NotImplementedError

    @abstractmethod
    def exchange_callback(self, code: Optional[str] = None,
                          openid_params: Optional[Mapping[str, str]] = None) -> FederatedAccount:
        """
        Verifica la respuesta del proveedor externo (código OAuth2 o parámetros OpenID)
        y devuelve los datos verificados de la cuenta.
        """
        raise NotImplementedError


class IFederatedAuthProviderResolver(ABC):
    """Resuelve el adaptador de autenticación federada correspondiente al proveedor solicitado."""

    @abstractmethod
    def resolve(self, provider_name: str) -> IFederatedAuthProvider:
        raise NotImplementedError
