from sqlalchemy.orm import Session

from app.application.ports.i_pending_email_change_repository import IPendingEmailChangeRepository
from app.domain.models.pending_email_change import PendingEmailChange
from app.infrastructure.database.mappers.pending_email_change_mapper import PendingEmailChangeMapper
from app.infrastructure.database.models.pending_email_change_orm import PendingEmailChangeORM


class PendingEmailChangeRepositoryImpl(IPendingEmailChangeRepository):
    def __init__(self, session: Session):
        self._session = session

    def save(self, email_change: PendingEmailChange) -> None:
        email_change_orm = PendingEmailChangeMapper.domain_to_orm(email_change)
        if not email_change.is_persisted():
            # Una nueva solicitud reemplaza la pendiente del mismo usuario.
            existing = self._session.query(PendingEmailChangeORM).filter(
                PendingEmailChangeORM.user_id == email_change.user_id,
            ).with_for_update().first()
            if existing is not None:
                email_change_orm.pending_email_change_id = existing.pending_email_change_id
        saved = self._session.merge(email_change_orm)
        self._session.flush()
        email_change.pending_email_change_id = saved.pending_email_change_id

    def get_by_token_hash(self, token_hash: str) -> PendingEmailChange | None:
        record = self._session.query(PendingEmailChangeORM).filter(
            PendingEmailChangeORM.token_hash == token_hash,
        ).first()
        return PendingEmailChangeMapper.orm_to_domain(record) if record else None

    def consume(self, token_hash: str) -> bool:
        deleted = self._session.query(PendingEmailChangeORM).filter(
            PendingEmailChangeORM.token_hash == token_hash,
        ).delete(synchronize_session=False)
        self._session.flush()
        return deleted == 1

    def delete_by_user_id(self, user_id: int) -> None:
        self._session.query(PendingEmailChangeORM).filter(
            PendingEmailChangeORM.user_id == user_id,
        ).delete(synchronize_session=False)
        self._session.flush()
