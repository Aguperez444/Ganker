from abc import ABC, abstractmethod

from app.domain.models.pending_registration import PendingRegistration


class IPendingRegistrationRepository(ABC):
    @abstractmethod
    def save(self, registration: PendingRegistration) -> None:
        raise NotImplementedError

    @abstractmethod
    def get_by_mail(self, mail: str) -> PendingRegistration | None:
        raise NotImplementedError

    @abstractmethod
    def get_by_token_hash(self, token_hash: str) -> PendingRegistration | None:
        raise NotImplementedError

    @abstractmethod
    def consume(self, token_hash: str) -> bool:
        """Elimina la solicitud solo si el token todavía es el actual, dentro de la transacción."""
        raise NotImplementedError
