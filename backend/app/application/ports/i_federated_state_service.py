from abc import ABC, abstractmethod

from app.domain.models.federated_identity import FederatedAccount, FederatedProvider


class IFederatedStateService(ABC):
    """Tokens firmados de corta duración para proteger el flujo de login/registro federado."""

    @abstractmethod
    def create_state(self, provider: FederatedProvider) -> str:
        """Genera un parámetro 'state' firmado para prevenir CSRF en el flujo OAuth/OpenID."""
        raise NotImplementedError

    @abstractmethod
    def validate_state(self, state: str, expected_provider: FederatedProvider) -> None:
        """Comprueba que el 'state' sea válido, no haya vencido y corresponda al proveedor esperado."""
        raise NotImplementedError

    @abstractmethod
    def create_registration_token(self, account: FederatedAccount) -> str:
        """Genera un token temporal firmado con los datos verificados del proveedor para completar el registro."""
        raise NotImplementedError

    @abstractmethod
    def decode_registration_token(self, token: str) -> FederatedAccount:
        """Valida y decodifica el token temporal de registro federado."""
        raise NotImplementedError
