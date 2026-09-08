import pytest
from datetime import timedelta
from freezegun import freeze_time
import jwt

from app.infrastructure.api.auth.jwt_token_service import JwtTokenService
from app.domain.exceptions.auth.invalid_token_exception import InvalidTokenException
from app.domain.models.user_role import UserRole


class TestJwtTokenService:

    @pytest.fixture
    def token_service(self):
        return JwtTokenService(
            secret_key="my-super-secret-key-that-is-at-least-32-bytes-long!",
            access_expiration_minutes=15,
            refresh_expiration_days=7
        )

    def test_generate_and_verify_access_token(self, token_service):
        access_token, refresh_token, jti, exp = token_service.generate_tokens(user_id=42, role=UserRole.PLAYER)

        assert isinstance(access_token, str)
        assert isinstance(refresh_token, str)
        assert isinstance(jti, str)
        assert access_token != refresh_token

        data = token_service.verify_access_token(access_token)
        assert data["user_id"] == 42
        assert data["role"] == UserRole.PLAYER

    def test_generate_and_verify_refresh_token(self, token_service):
        _, refresh_token, jti, _ = token_service.generate_tokens(user_id=100, role=UserRole.ADMIN)

        data = token_service.verify_refresh_token(refresh_token)
        assert data["user_id"] == 100
        assert data["role"] == UserRole.ADMIN
        assert data["jti"] == jti
        assert "exp" in data

    def test_verify_access_token_with_refresh_token_fails(self, token_service):
        _, refresh_token, _, _ = token_service.generate_tokens(user_id=42, role=UserRole.PLAYER)

        with pytest.raises(InvalidTokenException) as exc_info:
            token_service.verify_access_token(refresh_token)

        assert "no es un access token" in exc_info.value.message
        assert exc_info.value.status_code == 401

    def test_verify_refresh_token_with_access_token_fails(self, token_service):
        access_token, _, _, _ = token_service.generate_tokens(user_id=42, role=UserRole.PLAYER)

        with pytest.raises(InvalidTokenException) as exc_info:
            token_service.verify_refresh_token(access_token)

        assert "no es un refresh token" in exc_info.value.message
        assert exc_info.value.status_code == 401

    def test_verify_refresh_token_missing_jti_fails(self, token_service):
        # Manually encode a refresh token payload without 'jti'
        bad_payload = {
            "sub": "42",
            "role": "player",
            "type": "refresh"
        }
        token = jwt.encode(bad_payload, token_service.secret_key, algorithm="HS256")

        with pytest.raises(InvalidTokenException) as exc_info:
            token_service.verify_refresh_token(token)

        assert "falta jti" in exc_info.value.message
        assert exc_info.value.status_code == 401

    def test_access_token_expired(self, token_service):
        with freeze_time("2026-01-01 12:00:00") as frozen_time:
            access_token, _, _, _ = token_service.generate_tokens(user_id=42, role=UserRole.PLAYER)

            # Valid right after creation
            data = token_service.verify_access_token(access_token)
            assert data["user_id"] == 42

            # Advance time by 16 minutes (access token expires in 15 min)
            frozen_time.tick(delta=timedelta(minutes=16))

            with pytest.raises(InvalidTokenException) as exc_info:
                token_service.verify_access_token(access_token)
            assert exc_info.value.status_code == 401

    def test_refresh_token_expired(self, token_service):
        with freeze_time("2026-01-01 12:00:00") as frozen_time:
            _, refresh_token, _, _ = token_service.generate_tokens(user_id=42, role=UserRole.PLAYER)

            # Advance time by 8 days (refresh token expires in 7 days)
            frozen_time.tick(delta=timedelta(days=8))

            with pytest.raises(InvalidTokenException) as exc_info:
                token_service.verify_refresh_token(refresh_token)
            assert exc_info.value.status_code == 401

    def test_invalid_signature(self, token_service):
        access_token, _, _, _ = token_service.generate_tokens(user_id=42, role=UserRole.PLAYER)

        different_service = JwtTokenService(
            secret_key="completely-different-key-that-is-also-32-bytes-long!",
            access_expiration_minutes=15,
            refresh_expiration_days=7
        )

        with pytest.raises(InvalidTokenException) as exc_info:
            different_service.verify_access_token(access_token)
        assert exc_info.value.status_code == 401
