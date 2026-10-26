from app.domain.models.pending_email_change import PendingEmailChange
from app.infrastructure.database.models.pending_email_change_orm import PendingEmailChangeORM


class PendingEmailChangeMapper:
    @staticmethod
    def orm_to_domain(email_change_orm: PendingEmailChangeORM) -> PendingEmailChange:
        return PendingEmailChange(
            pending_email_change_id=email_change_orm.pending_email_change_id,
            user_id=email_change_orm.user_id,
            mail=email_change_orm.mail,
            token_hash=email_change_orm.token_hash,
            expires_at=email_change_orm.expires_at,
        )

    @staticmethod
    def domain_to_orm(email_change: PendingEmailChange) -> PendingEmailChangeORM:
        if not email_change.is_persisted():
            return PendingEmailChangeORM(
                user_id=email_change.user_id,
                mail=email_change.mail,
                token_hash=email_change.token_hash,
                expires_at=email_change.expires_at,
            )
        return PendingEmailChangeORM(
            pending_email_change_id=email_change.pending_email_change_id,
            user_id=email_change.user_id,
            mail=email_change.mail,
            token_hash=email_change.token_hash,
            expires_at=email_change.expires_at,
        )
