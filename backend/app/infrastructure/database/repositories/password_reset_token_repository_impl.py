from datetime import datetime
from typing import Optional

from sqlalchemy.orm import Session

from app.application.ports.i_password_reset_token_repository import IPasswordResetTokenRepository
from app.infrastructure.database.models.password_reset_token_orm import PasswordResetTokenORM


class PasswordResetTokenRepositoryImpl(IPasswordResetTokenRepository):

    def __init__(self, session: Session):
        self._session = session

    def create(self, user_id: int, token_hash: str, expires_at: datetime) -> PasswordResetTokenORM:
        reset_token = PasswordResetTokenORM(
            user_id=user_id,
            token_hash=token_hash,
            expires_at=expires_at,
            is_used=False,
        )
        self._session.add(reset_token)
        self._session.flush()
        return reset_token

    def get_by_token_hash(self, token_hash: str) -> Optional[PasswordResetTokenORM]:
        return (
            self._session.query(PasswordResetTokenORM)
            .filter(PasswordResetTokenORM.token_hash == token_hash)
            .first()
        )

    def mark_as_used(self, token_id: int) -> None:
        token = (
            self._session.query(PasswordResetTokenORM)
            .filter(PasswordResetTokenORM.id == token_id)
            .first()
        )
        if token:
            token.is_used = True
            self._session.flush()

    def invalidate_all_user_tokens(self, user_id: int) -> None:
        token = (
            self._session.query(PasswordResetTokenORM)
            .filter(PasswordResetTokenORM.user_id == user_id)
        )
        for t in token:
            t.is_used = True
        self._session.flush()