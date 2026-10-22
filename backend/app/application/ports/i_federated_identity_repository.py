from abc import ABC, abstractmethod
from typing import List, Optional, TYPE_CHECKING

if TYPE_CHECKING:
    from app.domain.models.federated_identity import FederatedIdentity, FederatedProvider


class IFederatedIdentityRepository(ABC):

    @abstractmethod
    def get_by_provider_and_external_id(self, provider: 'FederatedProvider',
                                        provider_user_id: str) -> Optional['FederatedIdentity']:
        raise NotImplementedError

    @abstractmethod
    def get_by_user_and_provider(self, user_id: int,
                                 provider: 'FederatedProvider') -> Optional['FederatedIdentity']:
        raise NotImplementedError

    @abstractmethod
    def get_all_by_user_id(self, user_id: int) -> List['FederatedIdentity']:
        raise NotImplementedError

    @abstractmethod
    def save(self, identity: 'FederatedIdentity') -> 'FederatedIdentity':
        raise NotImplementedError

    @abstractmethod
    def delete_by_user_id(self, user_id: int) -> bool:
        raise NotImplementedError
