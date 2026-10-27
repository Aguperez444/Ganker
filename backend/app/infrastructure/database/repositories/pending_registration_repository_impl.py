from sqlalchemy.orm import Session

from app.application.ports.i_pending_registration_repository import IPendingRegistrationRepository
from app.domain.models.pending_registration import PendingRegistration
from app.infrastructure.database.mappers.pending_registration_mapper import PendingRegistrationMapper
from app.infrastructure.database.models.pending_registration_orm import PendingRegistrationORM


class PendingRegistrationRepositoryImpl(IPendingRegistrationRepository):
    def __init__(self, session: Session):
        self._session = session

    def save(self, registration: PendingRegistration) -> None:
        registration_orm = PendingRegistrationMapper.domain_to_orm(registration)
        registration_orm.mail = registration.mail.strip().lower()
        if not registration.is_persisted():
            # Repetir el registro reemplaza la solicitud pendiente del mismo correo.
            existing = self._session.query(PendingRegistrationORM).filter(
                PendingRegistrationORM.mail == registration_orm.mail,
            ).with_for_update().first()
            if existing is not None:
                registration_orm.registration_id = existing.registration_id
        saved = self._session.merge(registration_orm)
        self._session.flush()
        registration.registration_id = saved.registration_id

    def get_by_mail(self, mail: str) -> PendingRegistration | None:
        record = self._session.query(PendingRegistrationORM).filter(
            PendingRegistrationORM.mail == mail.strip().lower(),
        ).with_for_update().first()
        return PendingRegistrationMapper.orm_to_domain(record) if record else None

    def get_by_token_hash(self, token_hash: str) -> PendingRegistration | None:
        record = self._session.query(PendingRegistrationORM).filter(
            PendingRegistrationORM.token_hash == token_hash,
        ).with_for_update().first()
        return PendingRegistrationMapper.orm_to_domain(record) if record else None

    def consume(self, token_hash: str) -> bool:
        deleted = self._session.query(PendingRegistrationORM).filter(
            PendingRegistrationORM.token_hash == token_hash,
        ).delete(synchronize_session=False)
        self._session.flush()
        return deleted == 1
