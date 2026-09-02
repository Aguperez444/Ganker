import pytest
from app.infrastructure.api.auth.password_hash_service import PasswordHashService


class TestPasswordHashService:

    @pytest.fixture
    def hasher(self):
        return PasswordHashService()

    def test_hash_and_verify_correct_password(self, hasher):
        plain = "MySecretPassword123"
        hashed = hasher.hash_password(plain)

        assert isinstance(hashed, str)
        assert hashed.startswith("$argon2")
        assert hasher.verify_password(plain, hashed) is True

    def test_verify_incorrect_password(self, hasher):
        plain = "CorrectPassword123"
        wrong = "WrongPassword123"
        hashed = hasher.hash_password(plain)

        assert hasher.verify_password(wrong, hashed) is False

    def test_verify_malformed_hash(self, hasher):
        assert hasher.verify_password("Password123", "not_a_valid_hash_string") is False
        assert hasher.verify_password("Password123", "") is False
