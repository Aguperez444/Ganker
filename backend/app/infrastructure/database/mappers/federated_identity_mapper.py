from app.domain.models.federated_identity import FederatedIdentity, FederatedProvider
from app.infrastructure.database.models.federated_identity_orm import FederatedIdentityORM


class FederatedIdentityMapper:

    @staticmethod
    def orm_to_domain(orm: FederatedIdentityORM) -> FederatedIdentity:
        return FederatedIdentity(
            identity_id=orm.federated_identity_id,
            user_id=orm.user_id,
            provider=FederatedProvider(orm.provider),
            provider_user_id=orm.provider_user_id,
            email=orm.email,
            linked_at=orm.linked_at,
        )

    @staticmethod
    def domain_to_orm(domain: FederatedIdentity) -> FederatedIdentityORM:
        return FederatedIdentityORM(
            user_id=domain.user_id,
            provider=domain.provider.value,
            provider_user_id=domain.provider_user_id,
            email=domain.email,
            linked_at=domain.linked_at,
        )
