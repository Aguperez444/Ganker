import datetime
import pytest
from app.infrastructure.database.repositories.refresh_token_repository_impl import RefreshTokenRepositoryImpl


class TestRefreshTokenRepositoryIntegration:

    def test_save_and_is_valid(self, test_db_session, seed_player):
        repo = RefreshTokenRepositoryImpl(test_db_session)
        expires_at = datetime.datetime.now(datetime.timezone.utc) + datetime.timedelta(days=7)

        repo.save(
            user_id=seed_player.user_id,
            role="player",
            jti="valid-uuid-1",
            expires_at=expires_at
        )
        test_db_session.commit()

        assert repo.is_valid("valid-uuid-1") is True
        assert repo.is_valid("unknown-jti") is False

    def test_revoke_by_jti(self, test_db_session, seed_player):
        repo = RefreshTokenRepositoryImpl(test_db_session)
        expires_at = datetime.datetime.now(datetime.timezone.utc) + datetime.timedelta(days=7)

        repo.save(
            user_id=seed_player.user_id,
            role="player",
            jti="to-revoke-uuid",
            expires_at=expires_at
        )
        test_db_session.commit()

        assert repo.is_valid("to-revoke-uuid") is True

        revoked = repo.revoke_by_jti("to-revoke-uuid")
        test_db_session.commit()
        assert revoked is True

        # Now is_valid must be False
        assert repo.is_valid("to-revoke-uuid") is False

        # Revoking again should return False
        assert repo.revoke_by_jti("to-revoke-uuid") is False

    def test_expired_token_is_not_valid(self, test_db_session, seed_player):
        repo = RefreshTokenRepositoryImpl(test_db_session)
        past_expires_at = datetime.datetime.now(datetime.timezone.utc) - datetime.timedelta(days=1)

        repo.save(
            user_id=seed_player.user_id,
            role="player",
            jti="expired-uuid",
            expires_at=past_expires_at
        )
        test_db_session.commit()

        assert repo.is_valid("expired-uuid") is False
