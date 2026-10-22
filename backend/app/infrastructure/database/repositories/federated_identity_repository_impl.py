from typing import List, Optional, TYPE_CHECKING

from app.application.ports.i_federated_identity_repository import IFederatedIdentityRepository
from app.infrastructure.database.mappers.federated_identity_mapper import FederatedIdentityMapper
from app.infrastructure.database.models.federated_identity_orm import FederatedIdentityORM
from app.infrastructure.database.models.user_orm import UserORM

if TYPE_CHECKING:
    from app.domain.models.federated_identity import FederatedIdentity, FederatedProvider


class FederatedIdentityRepositoryImpl(IFederatedIdentityRepository):
    def __init__(self, session):
        self.session = session

    def get_by_provider_and_external_id(self, provider: 'FederatedProvider',
                                        provider_user_id: str) -> Optional['FederatedIdentity']:
        found = (
            self.session.query(FederatedIdentityORM)
            .join(UserORM, UserORM.user_id == FederatedIdentityORM.user_id)
            .filter(
                FederatedIdentityORM.provider == provider.value,
                FederatedIdentityORM.provider_user_id == provider_user_id,
                UserORM.deleted == False,
            )
            .first()
        )
        return FederatedIdentityMapper.orm_to_domain(found) if found else None

    def get_by_user_and_provider(self, user_id: int,
                                 provider: 'FederatedProvider') -> Optional['FederatedIdentity']:
        found = (
            self.session.query(FederatedIdentityORM)
            .join(UserORM, UserORM.user_id == FederatedIdentityORM.user_id)
            .filter(
                FederatedIdentityORM.user_id == user_id,
                FederatedIdentityORM.provider == provider.value,
                UserORM.deleted == False,
            )
            .first()
        )
        return FederatedIdentityMapper.orm_to_domain(found) if found else None

    def get_all_by_user_id(self, user_id: int) -> List['FederatedIdentity']:
        found = (
            self.session.query(FederatedIdentityORM)
            .join(UserORM, UserORM.user_id == FederatedIdentityORM.user_id)
            .filter(
                FederatedIdentityORM.user_id == user_id,
                UserORM.deleted == False,
            )
            .all()
        )
        return [FederatedIdentityMapper.orm_to_domain(row) for row in found]

    def save(self, identity: 'FederatedIdentity') -> 'FederatedIdentity':
        if identity.is_persisted():
            orm_identity = self.session.query(FederatedIdentityORM).filter(
                FederatedIdentityORM.federated_identity_id == identity.identity_id
            ).first()
            orm_identity.email = identity.email
        else:
            stale_identities = (
                self.session.query(FederatedIdentityORM)
                .join(UserORM, UserORM.user_id == FederatedIdentityORM.user_id)
                .filter(
                    FederatedIdentityORM.provider == identity.provider.value,
                    FederatedIdentityORM.provider_user_id == identity.provider_user_id,
                    UserORM.deleted == True,
                )
                .all()
            )
            for stale in stale_identities:
                self.session.delete(stale)
            if stale_identities:
                self.session.flush()

            orm_identity = FederatedIdentityMapper.domain_to_orm(identity)
            self.session.add(orm_identity)

        self.session.flush()
        self.session.refresh(orm_identity)
        return FederatedIdentityMapper.orm_to_domain(orm_identity)

    def delete_by_user_id(self, user_id: int) -> bool:
        rows = self.session.query(FederatedIdentityORM).filter(
            FederatedIdentityORM.user_id == user_id
        ).all()
        if not rows:
            return False
        for row in rows:
            self.session.delete(row)
        self.session.flush()
        return True
