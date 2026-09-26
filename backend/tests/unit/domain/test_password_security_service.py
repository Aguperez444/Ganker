import pytest
from app.domain.services.password_security_service import PasswordSecurityService
from app.domain.exceptions.auth.password_is_not_secure_exception import PasswordIsNotSecureException


class TestPasswordSecurityService:

    def test_valid_password_passes(self):
        assert PasswordSecurityService.validate("ValidPass123") is True

    def test_password_too_short_raises_exception(self):
        with pytest.raises(PasswordIsNotSecureException) as exc_info:
            PasswordSecurityService.validate("Pass1")
        assert "al menos 8 caracteres" in exc_info.value.message

    def test_password_missing_uppercase_raises_exception(self):
        with pytest.raises(PasswordIsNotSecureException) as exc_info:
            PasswordSecurityService.validate("lowercase123")
        assert "al menos una letra mayúscula" in exc_info.value.message

    def test_password_missing_lowercase_raises_exception(self):
        with pytest.raises(PasswordIsNotSecureException) as exc_info:
            PasswordSecurityService.validate("UPPERCASE123")
        assert "al menos una letra minúscula" in exc_info.value.message

    def test_password_missing_number_raises_exception(self):
        with pytest.raises(PasswordIsNotSecureException) as exc_info:
            PasswordSecurityService.validate("NoNumbersPassword")
        assert "al menos un número" in exc_info.value.message
