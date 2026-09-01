import pytest
from datetime import timedelta
import jwt
from freezegun import freeze_time

from app.infrastructure.api.auth.jwt_token_service import JwtTokenService
from app.domain.exceptions.Invalid_token_exception import InvalidTokenException


class TestJwtTokenService:

    @pytest.fixture
    def token_service(self):
        return JwtTokenService(
            secret_key="my-super-secret-key-that-is-at-least-32-bytes-long!",
            access_expiration_minutes=15,
            refresh_expiration_days=7
        )

    def test_generate_and_verify_access_token(self, token_service):
        access_token, refresh_token = token_service.generate_tokens(user_id=42)

        assert isinstance(access_token, str)
        assert isinstance(refresh_token, str)
        assert access_token != refresh_token

        user_id = token_service.verify_access_token(access_token)
        assert user_id == 42

    def test_generate_and_verify_refresh_token(self, token_service):
        _, refresh_token = token_service.generate_tokens(user_id=100)

        user_id = token_service.verify_refresh_token(refresh_token)
        assert user_id == 100

    def test_verify_access_token_with_refresh_token_fails(self, token_service):
        _, refresh_token = token_service.generate_tokens(user_id=42)

        with pytest.raises(InvalidTokenException) as exc_info:
            token_service.verify_access_token(refresh_token)

        assert "no es un access token" in exc_info.value.message
        assert exc_info.value.status_code == 401

    def test_verify_refresh_token_with_access_token_fails(self, token_service):
        access_token, _ = token_service.generate_tokens(user_id=42)

        with pytest.raises(InvalidTokenException) as exc_info:
            token_service.verify_refresh_token(access_token)

        assert "no es un refresh token" in exc_info.value.message
        assert exc_info.value.status_code == 401

    def test_access_token_expired(self, token_service):
        with freeze_time("2026-01-01 12:00:00") as frozen_time:
            access_token, _ = token_service.generate_tokens(user_id=42)

            # Valid right after creation
            assert token_service.verify_access_token(access_token) == 42

            # Advance time by 16 minutes (access token expires in 15 min)
            frozen_time.tick(delta=timedelta(minutes=16))

            with pytest.raises(InvalidTokenException) as exc_info:
                token_service.verify_access_token(access_token)
            assert exc_info.value.status_code == 401

    def test_refresh_token_expired(self, token_service):
        with freeze_time("2026-01-01 12:00:00") as frozen_time:
            _, refresh_token = token_service.generate_tokens(user_id=42)

            # Advance time by 8 days (refresh token expires in 7 days)
            frozen_time.tick(delta=timedelta(days=8))

            with pytest.raises(InvalidTokenException) as exc_info:
                token_service.verify_refresh_token(refresh_token)
            assert exc_info.value.status_code == 401

    def test_invalid_signature(self, token_service):
        access_token, _ = token_service.generate_tokens(user_id=42)

        different_service = JwtTokenService(
            secret_key="completely-different-key-that-is-also-32-bytes-long!",
            access_expiration_minutes=15,
            refresh_expiration_days=7
        )

        with pytest.raises(InvalidTokenException) as exc_info:
            different_service.verify_access_token(access_token)
        assert exc_info.value.status_code == 401

