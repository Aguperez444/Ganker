from app.domain.models.pending_registration import PendingRegistration
from app.infrastructure.database.models import PendingRegistrationORM

class PendingRegistrationMapper:

    @staticmethod
    def orm_to_domain(pending_registration_orm: PendingRegistrationORM) -> PendingRegistration:
        return PendingRegistration(
            registration_id = pending_registration_orm.registration_id,
            mail = pending_registration_orm.mail,
            username = pending_registration_orm.username,
            name = pending_registration_orm.name,
            password_hash = pending_registration_orm.password_hash,
            token_hash = pending_registration_orm.token_hash,
            expires_at = pending_registration_orm.expires_at
        )

    @staticmethod
    def domain_to_orm(pending_registration: PendingRegistration) -> PendingRegistrationORM:
        if not pending_registration.is_persisted():
            return PendingRegistrationORM(
                mail=pending_registration.mail,
                username=pending_registration.username,
                name=pending_registration.name,
                password_hash=pending_registration.password_hash,
                token_hash=pending_registration.token_hash,
                expires_at=pending_registration.expires_at
            )
        return PendingRegistrationORM(
            registration_id=pending_registration.registration_id,
            mail=pending_registration.mail,
            username=pending_registration.username,
            name=pending_registration.name,
            password_hash=pending_registration.password_hash,
            token_hash=pending_registration.token_hash,
            expires_at=pending_registration.expires_at
        )